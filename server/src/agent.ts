import { AIMessage, HumanMessage } from '@langchain/core/messages';
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
} from '@langchain/langgraph';
import { chatAgentConfig } from './config';
import { TavilySearch } from "@langchain/tavily";
import type { ChatRequest, ChatResponse, Message } from './types';

import type { Response } from 'express';
// 调用外部 LLM API
const sendLLMMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  try {
    const messages = data.history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    messages.push({
      role: 'user',
      content: data.message,
    });

    const requestBody = {
      model: chatAgentConfig.model,
      messages: messages,
      stream: false,
    };

    const response = await fetch(chatAgentConfig.LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chatAgentConfig.API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        `LLM API request failed: ${response.status} ${response.statusText}`,
      );
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error(
        `LLM API request failed: ${response.status} ${response.statusText}`,
      );
    }

    // 获取结果
    const result = await response.json();


    const content =
      result.choices?.[0]?.message?.content ||
      'Sorry, I could not process your request.';

    return {
      id: Date.now().toString(),
      content: content,
    };
  } catch (error) {
    console.error(
      'ChatConfig:',
      chatAgentConfig.LLM_API_ENDPOINT,
      chatAgentConfig.API_KEY,
    );

    console.error('Failed to call LLM API:', error);
    throw new Error('Failed to connect to AI service.');
  }
};

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});

const chatNode = async (state: typeof StateAnnotation.State) => {
  try {
    const history: Message[] = state.messages
      .slice(0, -1)
      .map((msg, index) => ({
        id: Date.now().toString() + index,
        content: msg.content as string,
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        timestamp: new Date(),
      }));

    const latestUserMessage = state.messages[state.messages.length - 1];

    if (latestUserMessage && latestUserMessage._getType() === 'human') {
      const response = await sendLLMMessage({
        message: latestUserMessage.content as string,
        history: history,
      });

      return {
        messages: [new AIMessage(response.content)],
      };
    }

    return { messages: [] };
  } catch (error) {
    console.error('Chat node error:', error);
    return {
      messages: [
        new AIMessage(
          'Sorry, an error occurred while processing your request.',
        ),
      ],
    };
  }
};

const workflow = new StateGraph(StateAnnotation)
  .addNode('chatbot', chatNode)
  .addEdge('__start__', 'chatbot')
  .addEdge('chatbot', '__end__');


// 流式接口
export const streamLLMMessage = async (
  messages: Message[],
  res: Response,
  enableThinking: boolean = false,
  enableSearch: boolean = false,
): Promise<{ content: string; reasoning_content: string ,search_results: string}> => {
  try {
    let searchContext = '';
    let searchResultsStr = '';
    if (enableSearch) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        const searchResults = await performSearch(lastMessage.content);
        searchResultsStr = searchResults;

        // console.log('Search results:', searchResults);

        if (searchResults) {
          searchContext = `\n\n参考网络搜索结果:\n${searchResults}\n\n请根据上述搜索结果和你的知识回答问题。`;
          res.write(
            `data: ${JSON.stringify({
              search_results: searchResultsStr,
            })}\n\n`,
          );
        }
      }
    }

    const formattedMessages = messages.map((msg, index) => {
      // 如果是最后一条消息且有搜索结果，注入上下文
      let content = msg.content;
      if (enableSearch && index === messages.length - 1 && msg.role === 'user') {
        content += searchContext;
      }

      return {
        role: msg.role,
        content: content,
      };
    });

    const requestBody = {
      model: chatAgentConfig.model,
      messages: formattedMessages,
      stream: true,
      stream_options: {
        include_usage: true,
      },
      thinking: {
        type: enableThinking ? 'enabled' : 'disabled',
      },
    };

    const llmResponse = await fetch(chatAgentConfig.LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chatAgentConfig.API_KEY}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error(
        `LLM API request failed: ${llmResponse.status} ${llmResponse.statusText}`,
        errorBody,
      );
      throw new Error(
        `LLM API request failed: ${llmResponse.status} ${llmResponse.statusText}`,
      );
    }

    if (!llmResponse.body) {
      throw new Error('Response body is null');
    }

    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let fullContent = '';
    let fullReasoning = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (jsonStr === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if(delta){
              const contentChunk = delta.content||'';
              const reasoningChunk = delta.reasoning_content||'';

              if(contentChunk||reasoningChunk){
                fullContent += contentChunk;
                fullReasoning += reasoningChunk;
                res.write(
                  `data: ${JSON.stringify({
                    content: contentChunk,
                    reasoning_content: reasoningChunk
                  })}\n\n`,
                );

              }
            }

          } catch (e) {
            console.error('Failed to parse stream chunk:', jsonStr, e);
          }
        }
      }
    }
    return {content: fullContent, reasoning_content: fullReasoning, search_results: searchResultsStr}; // 返回完整内容供保存
  } catch (error) {
    console.error('Failed to stream LLM message:', error);
    throw error;
  }
};

const performSearch = async (query: string): Promise<string> => {
  try {
    const tool = new TavilySearch({
      tavilyApiKey: chatAgentConfig.TAVILY_API_KEY,
      maxResults: 3,
    });

    // 注意：TavilySearch 通常接收一个对象参数 { query: string }
    const result = await tool.invoke({ query });

    return JSON.stringify(result);
  } catch (e) {
    console.error('Search failed:', e);
    return '';
  }
};



export const chatAgent = workflow.compile();

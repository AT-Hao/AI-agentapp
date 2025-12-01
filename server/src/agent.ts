import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Message, ChatRequest, ChatResponse } from "./types";
import { chatAgentConfig } from "./config";

import { Response } from 'express';

// 调用外部 LLM API
const sendLLMMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  try {
    // 创建system prompt消息
    // const messages = [{
    //   role: 'system',
    //   content: 'You are a helpful assistant.',
    // }];
    // data.history.forEach(msg => {
    //   messages.push({
    //     role: msg.role === 'user' ? 'user' : 'assistant',
    //     content: msg.content,
    //   });
    // });

    const messages = data.history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
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
        'Authorization': `Bearer ${chatAgentConfig.API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`LLM API request failed: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      throw new Error(`LLM API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    return {
      id: Date.now().toString(),
      content: content,
    };
  } catch (error) {

    console.error('ChatConfig:', chatAgentConfig.LLM_API_ENDPOINT,chatAgentConfig.API_KEY);

    console.error('Failed to call LLM API:', error);
    throw new Error('Failed to connect to AI service.');
  }
};



const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec
});


const chatNode = async (state: typeof StateAnnotation.State) => {
  try {
    const history: Message[] = state.messages
      .slice(0, -1)
      .map((msg, index) => ({
        id: Date.now().toString() + index,
        content: msg.content as string,
        role: msg._getType() === "human" ? "user" : "assistant",
        timestamp: new Date(),
      }));

    const latestUserMessage = state.messages[state.messages.length - 1];

    if (latestUserMessage && latestUserMessage._getType() === "human") {
      const response = await sendLLMMessage({
        message: latestUserMessage.content as string,
        history: history,
      });

      return {
        messages: [new AIMessage(response.content)]
      };
    }

    return { messages: [] };
  } catch (error) {
    console.error("Chat node error:", error);
    return {
      messages: [new AIMessage("Sorry, an error occurred while processing your request.")]
    };
  }
};


const workflow = new StateGraph(StateAnnotation)
  .addNode("chatbot", chatNode)
  .addEdge("__start__", "chatbot")
  .addEdge("chatbot", "__end__");

export const streamLLMMessage = async (messages: Message[], res: Response) => {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const requestBody = {
      model: chatAgentConfig.model,
      messages: formattedMessages,
      stream: true, // Enable streaming
    };

    const llmResponse = await fetch(chatAgentConfig.LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chatAgentConfig.API_KEY}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error(`LLM API request failed: ${llmResponse.status} ${llmResponse.statusText}`, errorBody);
      throw new Error(`LLM API request failed: ${llmResponse.status} ${llmResponse.statusText}`);
    }

    if (!llmResponse.body) {
      throw new Error('Response body is null');
    }

    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last partial line in the buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (jsonStr === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }
          } catch (e) {
            console.error('Failed to parse stream chunk:', jsonStr, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to stream LLM message:', error);
    throw error; // Rethrow to be caught by the calling endpoint
  }
};

export const chatAgent = workflow.compile();

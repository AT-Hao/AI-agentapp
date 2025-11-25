import { useState, useCallback, useEffect } from 'react';
import { Message, Conversation, ChatRequest, ChatResponse } from '../types/chat';
import { sendChatMessage } from '../api/chat';

// 生成会话标题（基于第一条消息）
const generateConversationTitle = (message: string): string => {
  if (message.length <= 20) return message;
  return `${message.slice(0, 20)}...`;
};

export const useChat = () => {
  // 多会话管理
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取当前活跃会话
  const activeConversation = conversations.find(
    conv => conv.id === activeConversationId
  );

  // 初始化：创建默认会话
  useEffect(() => {
    if (conversations.length === 0) {
      const defaultConversation: Conversation = {
        id: 'default-1',
        title: '新会话',
        messages: [
          {
            id: '1',
            content: '你好！我是 AI 助手，有什么可以帮助你的？',
            role: 'assistant',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations([defaultConversation]);
      setActiveConversationId(defaultConversation.id);
    }
  }, [conversations]);

  // 新建会话
  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: '新会话',
      messages: [
        {
          id: Date.now().toString(),
          content: '你好！我是 AI 助手，有什么可以帮助你的？',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setError(null);
  }, []);

  // 删除会话
  const deleteConversation = useCallback((id: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);

    // 如果删除的是当前活跃会话，激活第一个会话
    if (id === activeConversationId && updatedConversations.length > 0) {
      setActiveConversationId(updatedConversations[0].id);
    } else if (updatedConversations.length === 0) {
      createNewConversation();
    }
  }, [conversations, activeConversationId, createNewConversation]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !activeConversationId || isLoading) return;

    // 查找当前会话并添加用户消息
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeConversationId) {
          const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: 'user',
            timestamp: new Date(),
          };

          // 更新会话标题（如果是第一条用户消息）
          const shouldUpdateTitle = conv.messages.length <= 1;
          const newTitle = shouldUpdateTitle
            ? generateConversationTitle(content)
            : conv.title;

          return {
            ...conv,
            title: newTitle,
            messages: [...conv.messages, userMessage],
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage({
        message: content,
        history: activeConversation?.messages || [],
      });

      // 添加 AI 回复
      const aiMessage: Message = {
        id: response.id,
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, aiMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        })
      );
    } catch (err) {
      setError('发送消息失败，请稍后再试');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, activeConversation?.messages, isLoading]);

  return {
    conversations,
    activeConversation,
    isLoading,
    error,
    sendMessage,
    createNewConversation,
    deleteConversation,
    setActiveConversationId,
  };
};

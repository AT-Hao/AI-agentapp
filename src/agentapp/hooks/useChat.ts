import { useState, useCallback, useEffect } from 'react';
import { Message, Conversation } from '../types/chat';
import { sendChatMessage } from '../api/chat';

// Generate conversation title (based on the first message)
const generateConversationTitle = (message: string): string => {
  if (message.length <= 20) return message;
  return `${message.slice(0, 20)}...`;
};

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversation = conversations.find(
    conv => conv.id === activeConversationId
  );

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

  const deleteConversation = useCallback((id: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);

    if (id === activeConversationId && updatedConversations.length > 0) {
      setActiveConversationId(updatedConversations[0].id);
    } else if (updatedConversations.length === 0) {
      createNewConversation();
    }
  }, [conversations, activeConversationId, createNewConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !activeConversationId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessagePlaceholder: Message = {
      id: aiMessageId,
      content: '', // Start with empty content
      role: 'assistant',
      timestamp: new Date(),
    };

    // Optimistically update UI with user's message and AI placeholder
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeConversationId) {
          const shouldUpdateTitle = conv.messages.length <= 1;
          const newTitle = shouldUpdateTitle
            ? generateConversationTitle(content)
            : conv.title;

          return {
            ...conv,
            title: newTitle,
            messages: [...conv.messages, userMessage, aiMessagePlaceholder],
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );

    setIsLoading(true);
    setError(null);

    try {
      const updatedMessages = activeConversation
        ? [...activeConversation.messages, userMessage]
        : [userMessage];

      const onChunk = (chunk: string) => {
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg => {
                  if (msg.id === aiMessageId) {
                    return { ...msg, content: msg.content + chunk };
                  }
                  return msg;
                }),
                updatedAt: new Date(),
              };
            }
            return conv;
          })
        );
      };

      // Call the backend API that now handles streaming
      await sendChatMessage(updatedMessages, onChunk);

    } catch (err: any) {
      setError(err.message || '发送消息失败，请稍后再试');
      console.error('Chat error:', err);
      // On error, remove the placeholder and the user message that triggered it
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.filter(m => m.id !== userMessage.id && m.id !== aiMessageId),
            };
          }
          return conv;
        })
      );
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

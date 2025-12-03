import { useCallback, useEffect, useState } from 'react';
import {
  createConversationApi,
  deleteConversationApi,
  fetchConversations,
  sendChatMessage,
} from '../api/chat';
import type { Conversation, Message } from '../types/chat';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化：从后端加载历史记录
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchConversations();
        setConversations(data);
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        } else {
          // 若无会话，自动创建一个
          await handleCreateNewChat();
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };
    loadData();
  }, []);

  const activeConversation = conversations.find(
    conv => conv.id === activeConversationId,
  );

  const handleCreateNewChat = useCallback(async () => {
    try {
      const newConv = await createConversationApi();
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('创建会话失败');
    }
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversationApi(id);
        setConversations(prev => {
          const updated = prev.filter(c => c.id !== id);
          if (id === activeConversationId) {
            setActiveConversationId(updated.length > 0 ? updated[0].id : null);
          }
          if (updated.length === 0) {
            // 可以在这里触发创建，或者留空
            handleCreateNewChat();
          }
          return updated;
        });
      } catch (e) {
        setError('删除失败');
      }
    },
    [activeConversationId, handleCreateNewChat],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !activeConversationId || isLoading) return;

      // 乐观 UI 更新
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
      };

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessagePlaceholder: Message = {
        id: aiMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              title:
                conv.messages.length === 0 ? content.slice(0, 20) : conv.title,
              messages: [...conv.messages, userMessage, aiMessagePlaceholder],
              updatedAt: new Date(),
            };
          }
          return conv;
        }),
      );

      setIsLoading(true);
      setError(null);

      try {
        await sendChatMessage(activeConversationId, content, chunk => {
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
                };
              }
              return conv;
            }),
          );
        });
      } catch (err: any) {
        setError(err.message || '发送失败');
        // 错误回滚（略）
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, isLoading],
  );

  return {
    conversations,
    activeConversation,
    isLoading,
    error,
    sendMessage,
    createNewConversation: handleCreateNewChat,
    deleteConversation: handleDeleteConversation,
    setActiveConversationId,
  };
};

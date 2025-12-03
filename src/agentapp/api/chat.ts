import type { Conversation } from '../types/chat';

const BACKEND_API_BASE = 'http://localhost:3001/api';

// 获取会话列表
export const fetchConversations = async (): Promise<Conversation[]> => {
  const res = await fetch(`${BACKEND_API_BASE}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const data = await res.json();
  // 转换时间字符串为 Date 对象
  return data.map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    messages: c.messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
};

// 创建会话
export const createConversationApi = async (): Promise<Conversation> => {
  const res = await fetch(`${BACKEND_API_BASE}/conversations`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const c = await res.json();
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    messages: [],
  };
};

// 删除会话
export const deleteConversationApi = async (id: string): Promise<void> => {
  const res = await fetch(`${BACKEND_API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
};

// 发送消息
export const sendChatMessage = async (
  conversationId: string, // 新增参数
  message: string,
  onChunk: (chunk: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      // 只需传 ID 和 Message，History 由后端从 DB 获取
      body: JSON.stringify({ conversationId, message }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'API request failed' }));
      throw new Error(errorData.error || 'API request failed');
    }

    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) onChunk(parsed.content);
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
};

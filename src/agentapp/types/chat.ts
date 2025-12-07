export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant'|'system';
  reasoning_content?: string;
  search_results?: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
}

export interface ChatResponse {
  content: string;
  id: string;
}

// 新增：会话类型
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

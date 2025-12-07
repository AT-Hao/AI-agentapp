//  message
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant'|'system';
  reasoning_content?: string;
  search_results?: string;
  timestamp: Date;
}

// API request
export interface ChatRequest {
  message: string;
  history: Message[];
  previous_response_id?: string;
  enableThinking?: boolean;
  enableSearch?: boolean;
}

// API response
export interface ChatResponse {
  id: string;
  content: string;
  reasoning_content?: string;
  search_content?: string;
}

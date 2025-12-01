//  message
export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }

  // API request
  export interface ChatRequest {
    message: string;
    history: Message[];
  }

  // API response
  export interface ChatResponse {
    id: string;
    content: string;
  }

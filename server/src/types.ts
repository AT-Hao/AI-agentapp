// Basic message structure
export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }
  
  // Structure for a chat API request
  export interface ChatRequest {
    message: string;
    history: Message[];
  }
  
  // Structure for a chat API response
  export interface ChatResponse {
    id: string;
    content: string;
  }
  
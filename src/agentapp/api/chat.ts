import { Message } from '../types/chat';

const BACKEND_API_URL = 'http://localhost:3001/api/chat';


interface ApiResponse {
  content: string;
}

/**
 * Sends the entire message history to the backend server.
 * @param messages - The full array of messages in the current conversation.
 * @returns The AI's response content.
 */
export const sendChatMessage = async (messages: Message[]): Promise<string> => {
  try {
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const result: ApiResponse = await response.json();
    return result.content;

  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw new Error('Failed to connect to the chat service. Please try again later.');
  }
};

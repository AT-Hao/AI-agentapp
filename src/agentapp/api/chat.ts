import { Message } from '../types/chat';

const BACKEND_API_URL = 'http://localhost:3001/api/chat';


export const sendChatMessage = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      // Try to parse error from a non-streaming response
      const errorData = await response.json().catch(() => ({ error: 'API request failed with status ' + response.status }));
      throw new Error(errorData.error || 'API request failed');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
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
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              console.error('Stream error from server:', parsed.error);
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('Failed to parse stream chunk:', jsonStr, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw new Error('Failed to connect to the chat service. Please try again later.');
  }
};

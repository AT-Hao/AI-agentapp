import { ChatRequest, ChatResponse } from '../types/chat';

// 模拟 AI 聊天接口，实际项目中替换为真实接口
export const sendChatMessage = async (
  data: ChatRequest
): Promise<ChatResponse> => {

  // 预设AI响应
  const responses = [
    '你好。',
    '你好，我是一个 AI 助手。',
    '你好呀',
    '你好，很高兴遇见你',
    '请问有什么可以帮到你？',
  ];

  return {
    id: Date.now().toString(),
    content: responses[Math.floor(Math.random() * responses.length)],
  };
};

import 'dotenv/config';

interface ChatAgentConfig {
  LLM_API_ENDPOINT: string;
  API_KEY: string;
  model: string;
  temperature: number;
}

// 后续放入环境变量中
export const chatAgentConfig: ChatAgentConfig = {
  LLM_API_ENDPOINT: process.env.LLM_API_ENDPOINT || '',
  API_KEY: process.env.API_KEY || '',
  model: process.env.MODEL || '',
  temperature: 0.9,
};

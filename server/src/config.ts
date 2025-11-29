
// dotenv.config();
interface ChatAgentConfig {
  LLM_API_ENDPOINT: string;
  API_KEY: string;
  model: string;
  temperature: number;
}

// TODO: Move these values to environment variables for better security
export const chatAgentConfig: ChatAgentConfig = {
  LLM_API_ENDPOINT: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  API_KEY: "3c18b4a6-6ef5-477f-931a-fec34a64b6e9",
  model: 'doubao-seed-1-6-250615',
  temperature: 0.9,
};

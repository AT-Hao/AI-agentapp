import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { chatAgent , streamLLMMessage} from './agent';
import { Message } from './types';

const app = express();
const port = 3001; // Port for the backend server

app.use(cors());
app.use(bodyParser.json());

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body; // Expecting an array of messages

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body. "messages" array is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush the headers to establish the connection

  try {
    // Bypassing langgraph and directly streaming the LLM response
    await streamLLMMessage(messages, res);
  } catch (error) {
    console.error('API chat stream error:', error);
    // If an error occurs, write an error event to the stream.
    res.write(`data: {"error": "An error occurred while processing your chat request."}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

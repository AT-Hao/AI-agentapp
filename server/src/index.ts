import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { chatAgent } from './agent';
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

  try {
    // Convert the incoming message history to the format LangGraph expects
    const langGraphMessages = messages.map((msg: Message) => {
      return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
    });

    const currentState = {
      messages: langGraphMessages,
    };

    // Invoke the agent
    const result = await chatAgent.invoke(currentState);

    // Extract the last message from the agent's response
    const aiResponse = result.messages[result.messages.length - 1];

    res.json({ content: aiResponse.content });

  } catch (error) {
    console.error('API chat error:', error);
    res.status(500).json({ error: 'An error occurred while processing your chat request.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

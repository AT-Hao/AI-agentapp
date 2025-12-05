import { AIMessage, HumanMessage } from '@langchain/core/messages';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { chatAgent, streamLLMMessage } from './agent';
import { ConversationModel } from './models';

const app = express();
const port = 3001;

// 连接本地 MongoDB
mongoose
  .connect('mongodb://127.0.0.1:27017/ai-agent-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());

// 获取所有会话
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await ConversationModel.find().sort({
      updatedAt: -1,
    });
    const formatted = conversations.map(c => ({
      ...c.toObject(),
      id: c._id.toString(),
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// 创建新会话
app.post('/api/conversations', async (req, res) => {
  try {
    const newConv = new ConversationModel({
      title: '新会话',
      messages: [],
    });
    await newConv.save();
    res.json({ ...newConv.toObject(), id: newConv._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// 删除会话
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await ConversationModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// 聊天接口
app.post('/api/chat', async (req, res) => {
  const { conversationId, message, enableThinking } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: 'Missing conversationId or message' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 查找会话
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 保存用户消息到 DB
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    conversation.messages.push(userMsg as any);

    // 更新标题
    if (conversation.messages.length === 1) {
      conversation.title =
        message.length > 20 ? `${message.slice(0, 20)}...` : message;
    }
    await conversation.save();



    const { content: aiContent, reasoning_content: aiReasoning } = await streamLLMMessage(
      conversation.messages,
      res,
      enableThinking
    );

    // 保存 AI 回复到 DB
    const aiMsg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiContent,
      reasoning_content: aiReasoning,
      timestamp: new Date(),
    };
    // 重新获取会话以避免版本冲突（可选，但推荐）
    const updatedConversation =
      await ConversationModel.findById(conversationId);
    if (updatedConversation) {
      updatedConversation.messages.push(aiMsg as any);
      await updatedConversation.save();
    }

    // --- 修改部分结束 ---
  } catch (error) {
    console.error('Chat error:', error);
    // 如果流尚未结束，发送错误信息
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: 'Error processing request' })}\n\n`,
      );
    }
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

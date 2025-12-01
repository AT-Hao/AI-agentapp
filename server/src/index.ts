import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { chatAgent } from './agent';
import { ConversationModel } from './models';


const app = express();
const port = 3001;

// 连接本地 MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ai-agent-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());

// 获取所有会话
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await ConversationModel.find().sort({ updatedAt: -1 });
    const formatted = conversations.map(c => ({
      ...c.toObject(),
      id: c._id.toString()
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
      messages: []
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
  const { conversationId, message } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: 'Missing conversationId or message' });
  }

  // 设置 SSE 响应头，以便兼容前端的流式读取逻辑
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
      timestamp: new Date()
    };
    conversation.messages.push(userMsg as any);

    // 更新标题
    if (conversation.messages.length === 1) {
      conversation.title = message.length > 20 ? message.slice(0, 20) + '...' : message;
    }
    await conversation.save();

    // 构造 LangGraph 的输入状态
    const graphInputMessages = conversation.messages.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content);
      return new AIMessage(m.content);
    });

    // 调用 LangGraph 智能体
    const result = await chatAgent.invoke({ messages: graphInputMessages });  //不能使用流式

    // 获取 AI 的回复
    const lastMessage = result.messages[result.messages.length - 1];
    const aiContent = lastMessage.content as string;

    // 保存 AI 回复到 DB
    const aiMsg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiContent,
      timestamp: new Date()
    };
    conversation.messages.push(aiMsg as any);
    await conversation.save();

    // 发送响应给前端
    // 为了兼容前端的 onChunk 逻辑，我们将完整内容作为一个 chunk 发送
    res.write(`data: ${JSON.stringify({ content: aiContent })}\n\n`);

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: {"error": "Error processing request"}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

import mongoose, { Schema, type Document } from 'mongoose';

// 消息接口
export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  timestamp: Date;
}

// 会话接口
export interface IConversation extends Document {
  title: string;
  contextId?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// 消息 Schema
const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  content: { type: String, required: true },
  reasoning_content: {type: String},
  timestamp: { type: Date, default: Date.now },
});

// 会话 Schema
const ConversationSchema = new Schema(
  {
    title: { type: String, default: '新会话' },
    messages: [MessageSchema],
    contextId: { type: String },
  },
  {
    timestamps: true,
  },
);

export const ConversationModel = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema,
);

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  mindmapId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  nodeId?: string; // Optional context about which node they were looking at
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  mindmapId: { type: Schema.Types.ObjectId, ref: 'Mindmap', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  nodeId: { type: String, default: null }, // Optional context
  createdAt: { type: Date, default: Date.now }
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITodo extends Document {
  userId: mongoose.Types.ObjectId;
  mindmapId: mongoose.Types.ObjectId;
  taskText: string;
  dueDate: Date;
  isCompleted: boolean;
  emailReminderSent: boolean;
  createdAt: Date;
}

const TodoSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mindmapId: { type: Schema.Types.ObjectId, ref: 'Mindmap', required: true },
  taskText: { type: String, required: true },
  dueDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  emailReminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Todo: Model<ITodo> = mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema);

export default Todo;

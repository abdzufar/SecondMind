import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMindmap extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  isPublic: boolean;
  shareId?: string;
  topic: string;
  timeframe: string;
  startDate: Date;
  language: string;
  feasibilityWarning?: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: {
    id: string;
    type: 'roadmap-step' | 'mindmap-branch';
    data: {
      label: string;
      description: string;
      timeMark?: string;
    }
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
  }[];
}

const MindmapSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  
  isPublic: { type: Boolean, default: false },
  shareId: { type: String, unique: true, sparse: true },
  
  topic: { type: String, required: true },
  timeframe: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  language: { type: String, required: true },
  feasibilityWarning: { type: String, default: null },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  nodes: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['roadmap-step', 'mindmap-branch'], required: true },
    data: {
      label: { type: String, required: true },
      description: { type: String, required: true },
      timeMark: { type: String }
    }
  }],
  
  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true }
  }]
});

const Mindmap: Model<IMindmap> = mongoose.models.Mindmap || mongoose.model<IMindmap>('Mindmap', MindmapSchema);

export default Mindmap;

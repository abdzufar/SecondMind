import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const GenerateMindmapSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  language: z.string().min(1, 'Language is required'),
  verbosity: z.string().optional()
});

export const ElaborateMindmapSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  concept: z.string().min(1, 'Concept is required'),
  action: z.string().min(1, 'Action is required'),
  language: z.string().min(1, 'Language is required')
});

export const CreateTodoSchema = z.object({
  mindmapId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mindmap ID format'),
  taskText: z.string().min(1, 'Task text is required'),
  timeOffsetDays: z.number().nullable().optional()
});

export const UpdateTodoSchema = z.object({
  isCompleted: z.boolean()
});

export const UpdateMindmapSchema = z.object({
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  isPublic: z.boolean().optional()
});

export const ChatSchema = z.object({
  mindmapId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mindmap ID format'),
  message: z.string().min(1, 'Message is required'),
  nodeId: z.string().optional()
});

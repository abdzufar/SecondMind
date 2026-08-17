import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import mongoose from 'mongoose';
import Todo from '@/models/Todo';
import Mindmap from '@/models/Mindmap';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '64b5f8a0e4b0a1a1a1a1a1a1', name: 'Test User' }
  })
}));

describe('/api/todo/[id] CRUD Operations', () => {
  let mockTodoId: string;
  let mockMapId: string;

  beforeEach(async () => {
    await Mindmap.deleteMany({});
    await Todo.deleteMany({});
    
    const map = await Mindmap.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1',
      title: 'Map',
      topic: 'React',
      timeframe: '1 day',
      language: 'English',
      nodes: [],
      edges: []
    });
    mockMapId = map._id.toString();

    const todo = await Todo.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1',
      mindmapId: mockMapId,
      taskText: 'Task',
      dueDate: new Date(),
      isCompleted: false
    });
    mockTodoId = todo._id.toString();
  });

  it('PUT should successfully toggle the isCompleted status', async () => {
    const req = new NextRequest(`http://localhost:3000/api/todo/${mockTodoId}`, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted: true }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const res = await PUT(req, { params: Promise.resolve({ id: mockTodoId }) });
    expect(res.status).toBe(200);
    
    const check = await Todo.findById(mockTodoId);
    expect(check?.isCompleted).toBe(true);
  });

  it('DELETE should completely remove the todo', async () => {
    const req = new NextRequest(`http://localhost:3000/api/todo/${mockTodoId}`, { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: mockTodoId }) });
    expect(res.status).toBe(200);
    
    const check = await Todo.findById(mockTodoId);
    expect(check).toBeNull();
  });
});

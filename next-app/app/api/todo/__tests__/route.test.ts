import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import Mindmap from '@/models/Mindmap';
import Todo from '@/models/Todo';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '64b5f8a0e4b0a1a1a1a1a1a1', name: 'Test User' }
  })
}));

describe('/api/todo CRUD Operations', () => {
  let mockMapId: string;
  let mockDate: Date;

  beforeEach(async () => {
    await Mindmap.deleteMany({});
    await Todo.deleteMany({});
    
    mockDate = new Date('2026-08-16T00:00:00.000Z');
    
    const map = await Mindmap.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1',
      title: 'Todo Test Map',
      topic: 'React',
      timeframe: '1 day',
      language: 'English',
      createdAt: mockDate,
      nodes: [],
      edges: []
    });
    mockMapId = map._id.toString();
  });

  it('POST should create a Todo and mathematically calculate the correct dueDate', async () => {
    const req = new NextRequest(`http://localhost:3000/api/todo`, {
      method: 'POST',
      body: JSON.stringify({
        mindmapId: mockMapId,
        taskText: 'Do homework',
        timeOffsetDays: 3 // Adding 3 days to mockDate
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    
    const check = await Todo.findOne({ mindmapId: mockMapId });
    expect(check).not.toBeNull();
    
    // Original date + 3 days (3 * 24 * 60 * 60 * 1000)
    const expectedDate = new Date(mockDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    expect(check?.dueDate.getTime()).toBe(expectedDate.getTime());
  });

  it('GET should fetch all Todos for a specific mindmap via query param', async () => {
    // Seed some todos
    await Todo.create({ userId: '64b5f8a0e4b0a1a1a1a1a1a1', mindmapId: mockMapId, taskText: 'Task 1', dueDate: new Date() });
    
    const req = new NextRequest(`http://localhost:3000/api/todo?mindmapId=${mockMapId}`);
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].taskText).toBe('Task 1');
  });

  it('POST should return 404 if mindmap does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/todo`, {
      method: 'POST',
      body: JSON.stringify({ mindmapId: '64b5f8a0e4b0a1a1a1a1a999', taskText: 'Task', timeOffsetDays: 1 })
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('GET should return 500 on database error', async () => {
    jest.spyOn(Todo, 'find').mockImplementationOnce(() => { throw new Error('DB Error'); });
    const req = new NextRequest(`http://localhost:3000/api/todo?mindmapId=${mockMapId}`);
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('POST should return 500 on database error', async () => {
    jest.spyOn(Mindmap, 'findOne').mockImplementationOnce(() => { throw new Error('DB Error'); });
    const req = new NextRequest(`http://localhost:3000/api/todo`, {
      method: 'POST',
      body: JSON.stringify({ mindmapId: mockMapId, taskText: 'Task', timeOffsetDays: 1 })
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

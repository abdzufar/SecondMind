import { NextRequest } from 'next/server';
import { GET } from '../route';
import Mindmap from '@/models/Mindmap';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '64b5f8a0e4b0a1a1a1a1a1a1', name: 'Test User' }
  })
}));

describe('GET /api/mindmap', () => {
  beforeEach(async () => {
    await Mindmap.deleteMany({}); // Clean up before each test
  });

  it('should return a lightweight list of mindmaps for the authenticated user', async () => {
    // 1. Seed Database with a dummy mindmap
    await Mindmap.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1',
      title: 'My First Roadmap',
      topic: 'Docker',
      timeframe: '1 day',
      language: 'English',
      nodes: [{ id: 'n1', type: 'roadmap-step', data: { label: 'Node', description: 'Desc' } }],
      edges: []
    });

    // 2. Call GET endpoint
    const request = new NextRequest('http://localhost:3000/api/mindmap');
    const response = await GET();
    
    // 3. Assertions
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.length).toBe(1);
    expect(data[0].title).toBe('My First Roadmap');
    
    // Ensure nodes/edges are NOT returned to keep the dashboard payload small
    expect(data[0].nodes).toBeUndefined();
    expect(data[0].edges).toBeUndefined();
  });

  it('should return 500 on database error', async () => {
    jest.spyOn(Mindmap, 'find').mockImplementationOnce(() => { throw new Error('DB Error'); });
    const response = await GET();
    expect(response.status).toBe(500);
  });
});

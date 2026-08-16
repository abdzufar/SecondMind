import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import Mindmap from '@/models/Mindmap';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '64b5f8a0e4b0a1a1a1a1a1a1', name: 'Test User' }
  })
}));

describe('/api/mindmap/[id] CRUD Operations', () => {
  let mockMapId: string;

  beforeEach(async () => {
    await Mindmap.deleteMany({});
    const map = await Mindmap.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1',
      title: 'CRUD Map',
      topic: 'React',
      timeframe: '1 day',
      language: 'English',
      nodes: [{ id: 'n1', type: 'roadmap-step', data: { label: 'Node', description: 'Desc' } }],
      edges: []
    });
    mockMapId = map._id.toString();
  });

  it('GET should fetch a single mindmap fully populated with nodes and edges', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`);
    const res = await GET(req, { params: { id: mockMapId } });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('CRUD Map');
    expect(data.nodes.length).toBe(1); // Full payload including nodes
  });

  it('PUT should successfully update nodes and edges of the mindmap', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nodes: [],
        edges: []
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await PUT(req, { params: { id: mockMapId } });
    expect(res.status).toBe(200);
    
    // Verify changes persisted to the DB
    const check = await Mindmap.findById(mockMapId);
    expect(check?.nodes.length).toBe(0);
  });

  it('DELETE should delete the mindmap entirely', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`, { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: mockMapId } });
    expect(res.status).toBe(200);
    
    const check = await Mindmap.findById(mockMapId);
    expect(check).toBeNull();
  });
});

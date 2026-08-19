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
    const res = await GET(req, { params: Promise.resolve({ id: mockMapId }) });
    
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
    const res = await PUT(req, { params: Promise.resolve({ id: mockMapId }) });
    expect(res.status).toBe(200);
    
    // Verify changes persisted to the DB
    const check = await Mindmap.findById(mockMapId);
    expect(check?.nodes.length).toBe(0);
  });

  it('DELETE should delete the mindmap entirely', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`, { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: mockMapId }) });
    expect(res.status).toBe(200);
    
    const check = await Mindmap.findById(mockMapId);
    expect(check).toBeNull();
  });

  it('PUT should generate shareId if isPublic is true and no shareId exists', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`, {
      method: 'PUT',
      body: JSON.stringify({
        isPublic: true
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await PUT(req, { params: Promise.resolve({ id: mockMapId }) });
    expect(res.status).toBe(200);
    
    // Verify changes persisted to the DB
    const check = await Mindmap.findById(mockMapId);
    expect(check?.isPublic).toBe(true);
    expect(check?.shareId).toBeDefined();
    expect(typeof check?.shareId).toBe('string');
  });

  it('GET should return 404 if mindmap does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/64b5f8a0e4b0a1a1a1a1a999`);
    const res = await GET(req, { params: Promise.resolve({ id: '64b5f8a0e4b0a1a1a1a1a999' }) });
    expect(res.status).toBe(404);
  });

  it('PUT should return 404 if mindmap does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/64b5f8a0e4b0a1a1a1a1a999`, {
      method: 'PUT',
      body: JSON.stringify({ isPublic: true })
    });
    const res = await PUT(req, { params: Promise.resolve({ id: '64b5f8a0e4b0a1a1a1a1a999' }) });
    expect(res.status).toBe(404);
  });

  it('DELETE should return 404 if mindmap does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/64b5f8a0e4b0a1a1a1a1a999`, { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: '64b5f8a0e4b0a1a1a1a1a999' }) });
    expect(res.status).toBe(404);
  });

  it('GET should return 500 on database error', async () => {
    jest.spyOn(Mindmap, 'findOne').mockImplementationOnce(() => { throw new Error('DB Error'); });
    const req = new NextRequest(`http://localhost:3000/api/mindmap/${mockMapId}`);
    const res = await GET(req, { params: Promise.resolve({ id: mockMapId }) });
    expect(res.status).toBe(500);
  });
});

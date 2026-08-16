import { NextRequest } from 'next/server';
import { GET } from '../route';
import Mindmap from '@/models/Mindmap';

describe('GET /api/mindmap/share/[shareId]', () => {
  const mockShareId = 'test-share-123';
  let mockMapId: string;

  beforeEach(async () => {
    await Mindmap.deleteMany({});
    const map = await Mindmap.create({
      userId: '64b5f8a0e4b0a1a1a1a1a1a1', // Some arbitrary user
      title: 'Shared Map',
      topic: 'React',
      timeframe: '1 day',
      language: 'English',
      isPublic: true,
      shareId: mockShareId,
      nodes: [],
      edges: []
    });
    mockMapId = map._id.toString();
  });

  it('should return the mindmap if it is public and shareId matches', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/share/${mockShareId}`);
    const res = await GET(req, { params: { shareId: mockShareId } });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('Shared Map');
    expect(data.shareId).toBe(mockShareId);
  });

  it('should return 403 Forbidden if the mindmap is not public', async () => {
    // Toggle the map to private
    await Mindmap.findByIdAndUpdate(mockMapId, { isPublic: false });

    const req = new NextRequest(`http://localhost:3000/api/mindmap/share/${mockShareId}`);
    const res = await GET(req, { params: { shareId: mockShareId } });
    
    expect(res.status).toBe(403);
  });

  it('should return 404 if shareId does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/mindmap/share/invalid-id`);
    const res = await GET(req, { params: { shareId: 'invalid-id' } });
    
    expect(res.status).toBe(404);
  });
});

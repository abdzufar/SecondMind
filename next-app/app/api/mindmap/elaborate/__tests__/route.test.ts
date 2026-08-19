import { NextRequest } from 'next/server';
import { POST } from '../route';
import mongoose from 'mongoose';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: '64b5f8a0e4b0a1a1a1a1a1a1', name: 'Test User' }
  })
}));

// Mock Gemini AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            newNodes: [{
              id: "node-1-branch-1",
              type: "mindmap-branch",
              data: { label: "Images vs Containers", description: "Desc", timeOffsetDays: null }
            }],
            newEdges: [{
              id: "edge-1",
              source: "node-1",
              target: "node-1-branch-1"
            }]
          })
        }
      })
    })
  }))
}));

describe('POST /api/mindmap/elaborate', () => {
  it('should generate new branches via Gemini and return them', async () => {
    // 1. Construct JSON Body
    const body = {
      nodeId: "node-1",
      concept: "Understand Containers",
      action: "expand",
      language: "English"
    };

    // 2. Create NextRequest
    const request = new NextRequest('http://localhost:3000/api/mindmap/elaborate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 3. Call Route Handler
    const response = await POST(request);
    
    // 4. Assertions
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Check if Gemini JSON was parsed properly
    expect(data.newNodes).toBeDefined();
    expect(data.newEdges).toBeDefined();
    expect(data.newNodes[0].id).toBe("node-1-branch-1");
    expect(data.newEdges[0].source).toBe("node-1");
  });

  it('should return 400 if required fields are missing', async () => {
    const body = {
      // Missing nodeId, concept, etc.
      action: "expand"
    };

    const request = new NextRequest('http://localhost:3000/api/mindmap/elaborate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

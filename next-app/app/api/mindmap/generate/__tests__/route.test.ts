import { NextRequest } from 'next/server';
import { POST } from '../route';
import Mindmap from '@/models/Mindmap';
import mongoose from 'mongoose';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: 'Mocked PDF Text' }),
      destroy: jest.fn()
    }))
  };
});

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
            title: "AI Generated Title",
            topic: "Docker",
            feasibilityWarning: null,
            nodes: [{
              id: "node-1",
              type: "roadmap-step",
              data: { label: "Step 1", description: "Learn Containers", timeOffsetDays: 1 }
            }],
            edges: []
          })
        }
      })
    })
  }))
}));

describe('POST /api/mindmap/generate', () => {
  it('should generate a roadmap via Gemini, save to MongoDB, and return the _id', async () => {
    // 1. Construct Mock FormData
    const formData = new FormData();
    formData.append('topic', 'Docker');
    formData.append('timeframe', '1 week');
    formData.append('verbosity', 'detailed');
    formData.append('language', 'English');

    // 2. Create NextRequest
    const request = new NextRequest('http://localhost:3000/api/mindmap/generate', {
      method: 'POST',
      body: formData,
    });

    // 3. Call Route Handler
    const response = await POST(request);
    
    // 4. Assertions
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Check if Gemini JSON was parsed properly
    expect(data.title).toBe("AI Generated Title");
    expect(data.nodes.length).toBe(1);
    
    // Check Auto-Save behavior
    expect(data._id).toBeDefined();
    
    // Verify it exists in the Test DB
    const savedMap = await Mindmap.findById(data._id);
    expect(savedMap).not.toBeNull();
    expect(savedMap?.title).toBe("AI Generated Title");
  });

  it('should return 400 if required fields are missing', async () => {
    const formData = new FormData();
    // Missing topic, timeframe, etc.
    const request = new NextRequest('http://localhost:3000/api/mindmap/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should process a PDF file successfully', async () => {
    const formData = new FormData();
    formData.append('topic', 'Docker');
    formData.append('timeframe', '1 week');
    formData.append('language', 'English');
    formData.append('verbosity', 'normal');
    
    // Create a mock PDF file
    const mockFile = new File(['%PDF-1.4 mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', mockFile);

    const request = new NextRequest('http://localhost:3000/api/mindmap/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should process a text file successfully', async () => {
    const formData = new FormData();
    formData.append('topic', 'Docker');
    formData.append('timeframe', '1 week');
    formData.append('language', 'English');
    formData.append('verbosity', 'normal');
    
    const mockFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', mockFile);

    const request = new NextRequest('http://localhost:3000/api/mindmap/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});

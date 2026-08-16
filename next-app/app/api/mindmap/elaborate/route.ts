import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Avoid Vercel timeout limits

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { nodeId, concept, action, language } = body;

    if (!nodeId || !concept || !action || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-api-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Minimal mock prompt string. The actual prompt logic will be expanded in Phase 3.
    const prompt = `You are expanding a mindmap. The user wants to ${action} the concept: "${concept}". Return a JSON object with newNodes and newEdges linking from source ID "${nodeId}". Language: ${language}.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Strip markdown code blocks if Gemini returns them
    const cleanJson = responseText.replace(/```json\n?|```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    // Return the branches to the frontend (frontend will handle saving the map)
    return NextResponse.json({
      newNodes: parsedData.newNodes || [],
      newEdges: parsedData.newEdges || []
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ELABORATE_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

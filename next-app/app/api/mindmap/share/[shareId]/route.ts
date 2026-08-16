import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mindmap from '@/models/Mindmap';

export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    // Note: No session check required here! This is intentionally a public read-only route.
    
    await dbConnect();
    
    const mindmap = await Mindmap.findOne({ shareId: params.shareId });
    
    if (!mindmap) {
      return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 });
    }

    if (!mindmap.isPublic) {
      return NextResponse.json({ error: 'This mindmap is private and cannot be viewed.' }, { status: 403 });
    }

    // Return the full populated mindmap
    return NextResponse.json(mindmap, { status: 200 });

  } catch (err) {
    console.error('[GET_SHARE_MINDMAP_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

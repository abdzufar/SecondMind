import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Mindmap from '@/models/Mindmap';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch lightweight list (exclude heavy nodes and edges arrays to save bandwidth on Dashboard)
    const mindmaps = await Mindmap.find({ userId: session.user.id })
      .select('_id title topic timeframe createdAt isPublic shareId')
      .sort({ createdAt: -1 }); // Newest first

    return NextResponse.json(mindmaps, { status: 200 });

  } catch (error) {
    console.error('[GET_MINDMAPS_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

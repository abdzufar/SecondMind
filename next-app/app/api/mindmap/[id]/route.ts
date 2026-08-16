import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Mindmap from '@/models/Mindmap';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await dbConnect();
    const mindmap = await Mindmap.findOne({ _id: params.id, userId: (session.user as any).id });
    
    if (!mindmap) return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 });
    return NextResponse.json(mindmap, { status: 200 });
  } catch (err) {
    console.error('[GET_MINDMAP_ID_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { nodes, edges } = await req.json();
    
    await dbConnect();
    const updated = await Mindmap.findOneAndUpdate(
      { _id: params.id, userId: (session.user as any).id },
      { $set: { nodes, edges, updatedAt: Date.now() } },
      { new: true } // Return updated doc
    );
    
    if (!updated) return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Mindmap updated.' }, { status: 200 });
  } catch (err) {
    console.error('[PUT_MINDMAP_ID_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await dbConnect();
    const deleted = await Mindmap.findOneAndDelete({ _id: params.id, userId: (session.user as any).id });
    
    if (!deleted) return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Mindmap deleted.' }, { status: 200 });
  } catch (err) {
    console.error('[DELETE_MINDMAP_ID_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Mindmap from '@/models/Mindmap';
import Todo from '@/models/Todo';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const { mindmapId, taskText, timeOffsetDays } = body;
    
    if (!mindmapId || !taskText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    // Verify ownership of mindmap and extract its createdAt timestamp
    const mindmap = await Mindmap.findOne({ _id: mindmapId, userId: session.user.id });
    if (!mindmap) return NextResponse.json({ error: 'Mindmap not found or unauthorized' }, { status: 404 });

    // Mathematically calculate dueDate using the Mindmap's creation date as the anchor
    let dueDate = mindmap.createdAt;
    if (typeof timeOffsetDays === 'number') {
      dueDate = new Date(mindmap.createdAt.getTime() + (timeOffsetDays * 24 * 60 * 60 * 1000));
    }

    const newTodo = await Todo.create({
      userId: session.user.id,
      mindmapId,
      taskText,
      dueDate,
      isCompleted: false
    });

    return NextResponse.json(newTodo, { status: 201 });
  } catch (err) {
    console.error('[POST_TODO_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mindmapId = searchParams.get('mindmapId');

    if (!mindmapId) return NextResponse.json({ error: 'mindmapId query parameter is required' }, { status: 400 });

    await dbConnect();
    
    // Ensure the user actually owns the mindmap they are querying Todos for (Security)
    const mindmap = await Mindmap.findOne({ _id: mindmapId, userId: session.user.id });
    if (!mindmap) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const todos = await Todo.find({ mindmapId }).sort({ dueDate: 1 });
    
    return NextResponse.json(todos, { status: 200 });

  } catch (err) {
    console.error('[GET_TODOS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

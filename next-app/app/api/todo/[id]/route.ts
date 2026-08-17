import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Todo from '@/models/Todo';
import Mindmap from '@/models/Mindmap';

// Helper function to enforce cross-collection ownership:
// Todos don't have a userId, so we must check if the user owns the parent Mindmap.
async function checkOwnership(todoId: string, userId: string) {
  const todo = await Todo.findById(todoId);
  if (!todo) return null;
  const mindmap = await Mindmap.findOne({ _id: todo.mindmapId, userId });
  if (!mindmap) return null;
  return todo;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { isCompleted } = await req.json();
    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json({ error: 'isCompleted boolean is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Security check
    const todo = await checkOwnership(params.id, session.user.id);
    if (!todo) return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 });

    todo.isCompleted = isCompleted;
    await todo.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[PUT_TODO_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    // Security check
    const todo = await checkOwnership(params.id, session.user.id);
    if (!todo) return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 });

    await Todo.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[DELETE_TODO_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

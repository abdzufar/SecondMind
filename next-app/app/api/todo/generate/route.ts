import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Mindmap from '@/models/Mindmap';
import Todo from '@/models/Todo';
import { z } from 'zod';
import { WireMindmapNode, WireMindmapEdge } from '@/lib/types';

const GenerateTodoSchema = z.object({
  mindmapId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Mindmap ID format'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = GenerateTodoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { mindmapId } = parsed.data;

    await dbConnect();

    const mindmap = await Mindmap.findOne({ _id: mindmapId, userId: session.user.id });
    if (!mindmap) return NextResponse.json({ error: 'Mindmap not found or unauthorized' }, { status: 404 });

    const nodes = (mindmap.nodes as unknown as WireMindmapNode[]) || [];
    const edges = (mindmap.edges as unknown as WireMindmapEdge[]) || [];

    const roadmapSteps = nodes.filter(n => n.type === 'roadmap-step');
    let generatedCount = 0;

    for (const step of roadmapSteps) {
      const stepLabel = step.data?.label || 'Untitled Step';
      
      // Prevent duplicates by checking if a Todo with the same taskText already exists for this mindmap
      const existingTodo = await Todo.findOne({ mindmapId, taskText: stepLabel });
      if (existingTodo) continue;

      // Find all connected mindmap-branch nodes
      const connectedEdges = edges.filter(e => e.source === step.id);
      const connectedNodeIds = connectedEdges.map(e => e.target);
      
      const connectedBranches = nodes.filter(n => 
        connectedNodeIds.includes(n.id) && n.type === 'mindmap-branch'
      );

      // Build description string
      let description = '';
      if (connectedBranches.length > 0) {
        description = connectedBranches.map(branch => {
          const bLabel = branch.data?.label || '';
          const bDesc = branch.data?.description || '';
          return bDesc ? `- ${bLabel}: ${bDesc}` : `- ${bLabel}`;
        }).join('\n');
      }

      // Calculate dueDate
      const timeOffsetDays = step.data?.timeOffsetDays;
      let dueDate = mindmap.createdAt;
      if (typeof timeOffsetDays === 'number') {
        dueDate = new Date(mindmap.createdAt.getTime() + (timeOffsetDays * 24 * 60 * 60 * 1000));
      }

      await Todo.create({
        userId: session.user.id,
        mindmapId,
        taskText: stepLabel,
        description,
        dueDate,
        isCompleted: false
      });

      generatedCount++;
    }

    return NextResponse.json({ success: true, generatedCount }, { status: 201 });
  } catch (err) {
    console.error('[GENERATE_TODOS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

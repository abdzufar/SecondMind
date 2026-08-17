import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dbConnect from '@/lib/db';
import Todo from '@/models/Todo';

const resend = new Resend(process.env.RESEND_API_KEY || 'fake-key');

export async function GET(req: NextRequest) {
  try {
    // Vercel Cron sends an Authorization header with the CRON_SECRET for security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    await dbConnect();
    
    const now = new Date();
    // We want to find todos due before the END of today. 
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Find incomplete, unsent todos due today or earlier
    const dueTodos = await Todo.find({
      isCompleted: false,
      emailReminderSent: false,
      dueDate: { $lte: endOfToday }
    }).populate('userId');

    let emailsSent = 0;

    for (const todo of dueTodos) {
      if (!todo.userId || !(todo.userId as unknown as { email: string }).email) continue;
      const userEmail = (todo.userId as unknown as { email: string }).email;
      
      // Dispatch email via Resend
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'SecondMind <reminders@secondmind.app>',
        to: userEmail,
        subject: `Reminder: Your task "${todo.taskText}" is due today!`,
        html: `<p>Hello!</p>
               <p>This is a friendly reminder that your task <strong>"${todo.taskText}"</strong> is due today or overdue.</p>
               <p>Log in to SecondMind to check it off your roadmap!</p>`
      });

      // Mark as sent to prevent duplicate emails tomorrow
      todo.emailReminderSent = true;
      await todo.save();
      emailsSent++;
    }

    return NextResponse.json({ success: true, emailsSent }, { status: 200 });

  } catch (err) {
    console.error('[CRON_REMINDERS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

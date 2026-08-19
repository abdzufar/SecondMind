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
      if (!todo.userId) continue;
      
      const user = todo.userId as unknown as { email: string; emailRemindersEnabled?: boolean };
      if (!user.email) continue;
      
      // If user has explicitly opted out of email reminders, skip sending but mark as sent
      if (user.emailRemindersEnabled === false) {
        todo.emailReminderSent = true;
        await todo.save();
        continue;
      }
      
      const userEmail = user.email;
      
      // Dispatch email via Resend
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'SecondMind <reminders@secondmind.app>',
        to: userEmail,
        subject: `Reminder: Your task "${todo.taskText}" is due today!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e7d9c6; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #221b14; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.038em;">SecondMind</h1>
            </div>
            
            <div style="color: #6e6255; font-size: 16px; line-height: 24px;">
              <p>Hello,</p>
              <p>This is a friendly reminder that you have a task due today on your learning roadmap!</p>
              
              <div style="background-color: #f6e7e0; border-left: 4px solid #c75b39; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 8px 0; color: #221b14; font-size: 18px; font-weight: 700;">Task Details</h3>
                <p style="margin: 0; color: #221b14; font-weight: 600;">${todo.taskText}</p>
                ${todo.description ? `<div style="margin-top: 12px; font-size: 14px; color: #6e6255; white-space: pre-wrap;">${todo.description}</div>` : ''}
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/canvas/${todo.mindmapId}" style="background-color: #c75b39; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; display: inline-block;">
                  View Roadmap
                </a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e7d9c6; margin-top: 32px; padding-top: 24px; text-align: center; color: #9a8b79; font-size: 12px;">
              <p style="margin: 0 0 8px 0;">You are receiving this email because you have active tasks in SecondMind.</p>
              <p style="margin: 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/composer?settings=email" style="color: #c75b39; text-decoration: underline;">
                  Manage Notification Preferences
                </a>
              </p>
            </div>
          </div>
        `
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

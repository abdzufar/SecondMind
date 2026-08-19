import { NextRequest } from 'next/server';
import { GET } from '../route';
import mongoose from 'mongoose';
import Todo from '@/models/Todo';
import User from '@/models/User';
import Mindmap from '@/models/Mindmap';

// Mock Resend to prevent actual network calls and API key errors during testing
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
    }
  }))
}));

describe('/api/cron/reminders', () => {
  beforeAll(() => {
    process.env.CRON_SECRET = 'test-secret';
  });

  afterAll(() => {
    delete process.env.CRON_SECRET;
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Mindmap.deleteMany({});
    await Todo.deleteMany({});
  });

  it('should return 401 if CRON_SECRET is incorrect', async () => {
    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: { 'Authorization': 'Bearer wrong-secret' }
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should process due todos, send mock emails, and mark them as sent', async () => {
    const user = await User.create({ name: 'Test User', email: 'test@example.com' });
    const map = await Mindmap.create({ userId: user._id, title: 'Map', topic: 'React', timeframe: '1 day', language: 'en', nodes: [], edges: [] });
    
    // Create a past due todo
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const dueTodo = await Todo.create({
      userId: user._id,
      mindmapId: map._id,
      taskText: 'Learn hooks',
      dueDate: pastDate,
      isCompleted: false,
      emailReminderSent: false
    });

    // Create a future todo that should NOT be emailed
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    await Todo.create({
      userId: user._id,
      mindmapId: map._id,
      taskText: 'Future task',
      dueDate: futureDate,
      isCompleted: false,
      emailReminderSent: false
    });

    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: { 'Authorization': 'Bearer test-secret' }
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Only 1 email should have been sent
    expect(data.emailsSent).toBe(1);
    
    // Check if DB was updated correctly
    const updatedTodo = await Todo.findById(dueTodo._id);
    expect(updatedTodo?.emailReminderSent).toBe(true);
  });

  it('should skip sending emails if user opted out, but mark as sent', async () => {
    const user = await User.create({ name: 'Test User', email: 'test@example.com', emailRemindersEnabled: false });
    const map = await Mindmap.create({ userId: user._id, title: 'Map', topic: 'React', timeframe: '1 day', language: 'en', nodes: [], edges: [] });
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const dueTodo = await Todo.create({
      userId: user._id,
      mindmapId: map._id,
      taskText: 'Learn hooks',
      dueDate: pastDate,
      isCompleted: false,
      emailReminderSent: false
    });

    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: { 'Authorization': 'Bearer test-secret' }
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Should NOT have sent an email
    expect(data.emailsSent).toBe(0);
    
    // Check if DB was still updated correctly
    const updatedTodo = await Todo.findById(dueTodo._id);
    expect(updatedTodo?.emailReminderSent).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    jest.spyOn(Todo, 'find').mockImplementationOnce(() => { throw new Error('DB Error'); });
    const req = new NextRequest('http://localhost:3000/api/cron/reminders', {
      headers: { 'Authorization': 'Bearer test-secret' }
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

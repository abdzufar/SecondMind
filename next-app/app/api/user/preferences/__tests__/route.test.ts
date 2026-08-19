import { NextRequest } from 'next/server';
import { PATCH, GET } from '../route';
import mongoose from 'mongoose';
import User from '@/models/User';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { email: 'test@example.com' }
  })
}));

describe('/api/user/preferences CRUD Operations', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      emailRemindersEnabled: true
    });
  });

  describe('GET', () => {
    it('should return the current preferences of the authenticated user', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/preferences');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.emailRemindersEnabled).toBe(true);
    });

    it('should return 404 if user not found', async () => {
      await User.deleteMany({}); // Delete the seeded user
      const req = new NextRequest('http://localhost:3000/api/user/preferences');
      const res = await GET(req);
      
      expect(res.status).toBe(404);
    });

    it('should return 500 on database error', async () => {
      jest.spyOn(User, 'findOne').mockImplementationOnce(() => { throw new Error('DB Error'); });
      const req = new NextRequest('http://localhost:3000/api/user/preferences');
      const res = await GET(req);
      
      expect(res.status).toBe(500);
    });
  });

  describe('PATCH', () => {
    it('should update user preferences and return updated data', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ emailRemindersEnabled: false })
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.emailRemindersEnabled).toBe(false);
      
      const check = await User.findOne({ email: 'test@example.com' });
      expect(check?.emailRemindersEnabled).toBe(false);
    });

    it('should return 400 for invalid data type', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ emailRemindersEnabled: "not-a-boolean" })
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      await User.deleteMany({});
      const req = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ emailRemindersEnabled: false })
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(404);
    });

    it('should return 500 on database error', async () => {
      jest.spyOn(User, 'findOneAndUpdate').mockImplementationOnce(() => { throw new Error('DB Error'); });
      const req = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ emailRemindersEnabled: false })
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(500);
    });
  });
});

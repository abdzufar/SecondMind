import dbConnect from '../db';
import mongoose from 'mongoose';

jest.mock('mongoose', () => ({
  connection: { readyState: 0 },
  connect: jest.fn()
}));

describe('dbConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    if ((global as any).mongoose) {
      (global as any).mongoose.conn = null;
      (global as any).mongoose.promise = null;
    }
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });

  it('should throw error if MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;
    await expect(dbConnect()).rejects.toThrow('Please define the MONGODB_URI');
  });

  it('should connect to database and cache the connection', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValue({} as any);
    
    await dbConnect();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', { bufferCommands: false });
    
    // Call again to hit cached branch
    await dbConnect();
    expect(mongoose.connect).toHaveBeenCalledTimes(1); // Should not call connect again
  });

  it('should throw error if connection fails', async () => {
    (mongoose.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));
    
    await expect(dbConnect()).rejects.toThrow('Connection failed');
    expect((global as any).mongoose.promise).toBeNull();
  });
});

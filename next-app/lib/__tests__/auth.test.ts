import { authOptions } from '../auth';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

jest.mock('@/models/User');
jest.mock('bcryptjs');

describe('Auth Options', () => {
  it('should have Google and Credentials providers', () => {
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });

  it('authorize should throw if no credentials provided', async () => {
    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as any;
    await expect(credentialsProvider.options.authorize(undefined)).rejects.toThrow('Missing email or password');
  });

  it('authorize should return user if credentials are valid', async () => {
    const mockUser = { _id: '123', email: 'test@example.com', password: 'hashedpassword', name: 'Test' };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as any;
    const result = await credentialsProvider.options.authorize({ email: 'test@example.com', password: 'password123' });
    
    expect(result).toEqual({
      id: '123',
      email: 'test@example.com',
      name: 'Test'
    });
  });

  it('authorize should throw if user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as any;
    await expect(credentialsProvider.options.authorize({ email: 'wrong@example.com', password: 'password123' })).rejects.toThrow('Invalid email or password');
  });

  it('authorize should throw if password incorrect', async () => {
    const mockUser = { _id: '123', email: 'test@example.com', password: 'hashedpassword', name: 'Test' };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials') as any;
    await expect(credentialsProvider.options.authorize({ email: 'test@example.com', password: 'wrongpassword' })).rejects.toThrow('Invalid email or password');
  });
  
  it('callbacks should map token and session correctly', async () => {
    const jwtCallback = authOptions.callbacks?.jwt as any;
    const sessionCallback = authOptions.callbacks?.session as any;
    
    const mockUser = { id: 'user-123' };
    const mockToken = { sub: 'sub-123', id: 'token-id-123' };
    
    const newToken = await jwtCallback({ token: mockToken, user: mockUser });
    expect(newToken.id).toBe('user-123');
    
    const newSession = await sessionCallback({ session: { user: {} }, token: { id: 'token-123' } });
    expect(newSession.user.id).toBe('token-123');
  });

  describe('signIn callback', () => {
    it('should return true for non-google providers', async () => {
      const signInCallback = authOptions.callbacks?.signIn as any;
      const result = await signInCallback({ account: { provider: 'credentials' }, user: {} });
      expect(result).toBe(true);
    });

    it('should link existing user if google provider', async () => {
      const signInCallback = authOptions.callbacks?.signIn as any;
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-id' });
      
      const userObj: any = { email: 'google@test.com' };
      const result = await signInCallback({ account: { provider: 'google' }, user: userObj });
      
      expect(result).toBe(true);
      expect(userObj.id).toBe('existing-id');
    });

    it('should auto-register new user if google provider', async () => {
      const signInCallback = authOptions.callbacks?.signIn as any;
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ _id: 'new-id' });
      
      const userObj: any = { email: 'new@test.com', name: 'New User', image: 'img.png' };
      const result = await signInCallback({ account: { provider: 'google' }, user: userObj });
      
      expect(result).toBe(true);
      expect(userObj.id).toBe('new-id');
      expect(User.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@test.com',
        image: 'img.png'
      });
    });
  });
});

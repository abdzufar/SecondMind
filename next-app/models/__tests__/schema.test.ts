import mongoose from 'mongoose';
import User from '../User';
import Mindmap from '../Mindmap';
import Todo from '../Todo';

describe('Database Schema Validations', () => {
  // Test User Schema
  describe('User Schema', () => {
    it('should require name and email', async () => {
      const user = new User({});
      let error;
      try {
        await user.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should successfully validate with correct data', async () => {
      const user = new User({ name: 'Test User', email: 'test@example.com' });
      let error;
      try {
        await user.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error).toBeUndefined();
    });
  });

  // Test Mindmap Schema
  describe('Mindmap Schema', () => {
    it('should require a valid user reference', async () => {
      const mindmap = new Mindmap({
        title: 'Test Map',
        topic: 'Test Topic',
        timeframe: '1 day',
        language: 'English',
        nodes: [],
        edges: []
      });
      
      let error;
      try {
        await mindmap.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error.errors.userId).toBeDefined();
    });

    it('should strictly enforce node type enum', async () => {
      const mindmap = new Mindmap({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Map',
        topic: 'Docker',
        timeframe: '1 day',
        language: 'English',
        nodes: [{
          id: 'n1',
          type: 'invalid-type', // This should fail
          data: { label: 'Node 1', description: 'desc' }
        }],
        edges: []
      });
      
      let error;
      try {
        await mindmap.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error.errors['nodes.0.type']).toBeDefined();
      expect(error.errors['nodes.0.type'].message).toContain('is not a valid enum value');
    });

    it('should enforce required description in node data', async () => {
      const mindmap = new Mindmap({
        userId: new mongoose.Types.ObjectId(),
        title: 'Test Map',
        topic: 'Docker',
        timeframe: '1 day',
        language: 'English',
        nodes: [{
          id: 'n1',
          type: 'roadmap-step',
          data: { label: 'Node 1' } // Missing description
        }],
        edges: []
      });
      
      let error;
      try {
        await mindmap.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error.errors['nodes.0.data.description']).toBeDefined();
    });
  });

  // Test Todo Schema
  describe('Todo Schema', () => {
    it('should successfully validate a complete Todo', async () => {
      const todo = new Todo({
        userId: new mongoose.Types.ObjectId(),
        mindmapId: new mongoose.Types.ObjectId(),
        taskText: 'Study Docker containers',
        dueDate: new Date()
      });
      
      let error;
      try {
        await todo.validate();
      } catch (e: any) {
        error = e;
      }
      expect(error).toBeUndefined();
      expect(todo.isCompleted).toBe(false);
      expect(todo.emailReminderSent).toBe(false);
    });
  });
});

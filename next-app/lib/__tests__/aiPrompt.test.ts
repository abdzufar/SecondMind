import { getGeneratePrompt, getElaboratePrompt, getChatSystemPrompt } from '../aiPrompt';

describe('aiPrompt', () => {
  describe('getGeneratePrompt', () => {
    it('should handle summary verbosity', () => {
      const prompt = getGeneratePrompt('Docker', '1 week', 'English', 'summary', '');
      expect(prompt).toContain("You MUST NOT generate any 'mindmap-branch' nodes");
    });

    it('should handle detailed verbosity', () => {
      const prompt = getGeneratePrompt('Docker', '1 week', 'English', 'detail', '');
      expect(prompt).toContain("You MUST generate at least 3 to 5 highly specific 'mindmap-branch' nodes");
    });

    it('should include file context if provided', () => {
      const prompt = getGeneratePrompt('Docker', '1 week', 'English', 'normal', 'Mock file context');
      expect(prompt).toContain('=== SOURCE DOCUMENT ===');
      expect(prompt).toContain('Mock file context');
    });
  });

  describe('getChatSystemPrompt', () => {
    it('should include target node if provided', () => {
      const mindmapNodes = [{ id: '1', data: { label: 'Node 1', description: 'Desc 1' } }];
      const targetNode = { data: { label: 'Target Node', description: 'Target Desc' } };
      
      const prompt = getChatSystemPrompt('Docker', mindmapNodes, targetNode);
      expect(prompt).toContain('The user is currently looking specifically at the node titled "Target Node"');
      expect(prompt).toContain('Target Desc');
    });

    it('should not include target node if undefined', () => {
      const mindmapNodes = [{ id: '1', data: { label: 'Node 1', description: 'Desc 1' } }];
      
      const prompt = getChatSystemPrompt('Docker', mindmapNodes);
      expect(prompt).not.toContain('The user is currently looking specifically at the node titled');
    });
  });
});

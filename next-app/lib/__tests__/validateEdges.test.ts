import { validateEdges } from '../validateEdges';

describe('validateEdges', () => {
  it('should remove edges that connect to non-existent source or target nodes', () => {
    const nodes = [
      { id: 'n1' },
      { id: 'n2' },
      { id: 'n3' }
    ];
    
    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' }, // Valid
      { id: 'e2', source: 'n2', target: 'n3' }, // Valid
      { id: 'e3', source: 'n1', target: 'n99' }, // Invalid target
      { id: 'e4', source: 'n99', target: 'n3' }, // Invalid source
    ];
    
    const validEdges = validateEdges(nodes, edges);
    
    expect(validEdges.length).toBe(2);
    expect(validEdges[0].id).toBe('e1');
    expect(validEdges[1].id).toBe('e2');
  });

  it('should handle empty arrays gracefully', () => {
    expect(validateEdges([], [])).toEqual([]);
    expect(validateEdges([{id: '1'}], [])).toEqual([]);
    expect(validateEdges([], [{id: 'e1', source: '1', target: '2'}])).toEqual([]);
  });
});

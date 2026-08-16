export function getGeneratePrompt(topic: string, timeframe: string, language: string, verbosity: string = 'normal') {
  return `You are SecondMind, an expert educational architect.
Your task is to generate a comprehensive learning roadmap for the topic: "${topic}".
The user wants to complete this roadmap within: "${timeframe}".
Language: "${language}".

You must output a strictly valid JSON object matching this schema exactly:
{
  "title": "A short, catchy title for the roadmap",
  "feasibilityWarning": "If the timeframe is completely unrealistic (e.g., learning Quantum Physics in 1 day), provide a polite, short warning explaining why and suggest they pace themselves. If feasible, return null.",
  "nodes": [
    {
      "id": "node-1", // Must be unique strings
      "type": "roadmap-step", // Must be EXACTLY this string
      "data": {
        "label": "Short Actionable Step Name",
        "description": "Detailed explanation of what to learn here.",
        "timeOffsetDays": 1 // An integer representing what day this should be completed. E.g., 1 means day 1. If the timeframe is months, convert to days (e.g., month 1 = 30).
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1", // Must strictly match an existing node id
      "target": "node-2"  // Must strictly match an existing node id
    }
  ]
}

CRITICAL RULES:
- The output MUST be strictly valid JSON. Do not include markdown \`\`\`json blocks. Do not include any trailing commas.
- Ensure every edge source and target exists in the nodes array.
- Detail level should be: ${verbosity} (if 'detailed', add many sub-nodes and branches).
- The roadmap should be a directed acyclic graph (DAG), progressing logically.`;
}

export function getElaboratePrompt(concept: string, action: string, language: string, sourceNodeId: string) {
  return `You are SecondMind, an expert educational architect.
The user wants you to "${action}" the following concept from their roadmap: "${concept}".
Language: "${language}".

You must output a strictly valid JSON object containing new sub-nodes that branch off from the source node ID: "${sourceNodeId}".

Schema:
{
  "newNodes": [
    {
      "id": "unique-branch-id-1",
      "type": "mindmap-branch", // Must be EXACTLY this string
      "data": {
        "label": "Sub-concept",
        "description": "Detailed explanation.",
        "timeOffsetDays": null
      }
    }
  ],
  "newEdges": [
    {
      "id": "unique-edge-id-1",
      "source": "${sourceNodeId}",
      "target": "unique-branch-id-1"
    }
  ]
}

CRITICAL RULES:
- The output MUST be strictly valid JSON. Do not include markdown \`\`\`json blocks.
- Ensure every new edge correctly links the sourceNodeId to the new branch nodes.`;
}

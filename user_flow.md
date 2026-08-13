# SecondMind User Flow

Below is the complete user journey for SecondMind. Because this diagram is built using Mermaid (a text-based diagramming tool), it is entirely editable! You can change the text inside the blocks to adjust the flow as we refine the app.

```mermaid
graph TD
    A([Landing Page]) --> B{Logged In?}
    B -- No --> C[Sign Up / Login via NextAuth]
    C --> D[User Dashboard / Library]
    B -- Yes --> D

    D --> E[View Saved Mindmap]
    D --> F[+ Create New Mindmap]

    F --> G[/Input Parameters Modal/]
    G --> |1. Paste Text / Upload PDF<br>2. Set Goal & Verbosity| H[Loading: Gemini AI Generation]
    
    H --> I[Interactive Canvas View]
    E --> I

    I --> J[Manual Node Edits]
    J --> |Rename, Delete, Drag Wires| I

    I --> K[AI 'Elaborate' Actions]
    K --> |Explain, Quiz, Expand Node| I

    I --> L{Export / Share Menu}
    L --> M[/Download Image .PNG/]
    L --> O[/Generate Read-Only Link/]
```

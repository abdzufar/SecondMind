# SecondMind: Technical Implementation Plan

This document outlines the technical foundation and architecture for SecondMind, an educational hybrid roadmap/mindmap generator.

## Phase 4: Production Polish
- Setup Vercel Cron
- Implement Resend email templating
- Next.js build optimizations and final PWA asset generation.

---

## 🛠️ Partner Revisions (Architecture Refinements)
Based on recent feedback, we have made the following vital architectural pivots:
1. **Integer Time Offsets:** Replaced fragile `timeMark` string parsing with `timeOffsetDays` (Number) inside the node data. Gemini will output a raw integer (e.g., `1`, `7`), which is vastly more reliable for our Todo `dueDate` calculations. The frontend will handle formatting it as "Day X" or "Week Y".
2. **Frontend Dagre Layout:** Confirmed that `position` is deliberately omitted from the DB schema. The React Flow layout MUST be generated natively on the client using `dagre` when the roadmap loads.
3. **Strict Ownership Checks:** Ensure that dynamic routes (`GET/PUT/DELETE /api/mindmap/:id`) explicitly filter by `userId` to prevent ID guessing vulnerabilities.
4. **Cascading Deletes:** `DELETE /api/mindmap/:id` must now perform a `Todo.deleteMany({ mindmapId: id })` to prevent deleted roadmaps from firing orphaned email reminders via the cron job.
5. **Decoupled User Relational Array:** Removed the `mindmaps: [ObjectId]` array from the `User` schema. Querying `Mindmap.find({ userId: user._id })` is faster and completely avoids the two-way binding sync headaches during creation and deletion.

## User Review Required
Please review the 5 revisions above (specifically the `timeOffsetDays` approach). If approved, I will immediately update our existing Mongoose models and tests to pass.

## Proposed Changes

We will build this application within the existing `c:\Users\abdzu\Documents\Hacktiv8\P3\Final Project\SecondMind` repository. 

### Frontend Foundation (Partner's Domain)
- **Framework:** Next.js (App Router) with React, configured as a PWA (Progressive Web App) using `next-pwa` for device installation.
- **Styling & UI:** Tailwind CSS and `shadcn/ui` (for rapid, accessible component development).
- **Canvas & Layout:** `reactflow` (to render the interactive nodes) and `dagre` (to automatically calculate the X/Y coordinates for the linear roadmap layout).
- **State Management:** `zustand` (configured with `persist` middleware to cache roadmaps into browser storage for offline read-only viewing).

### Backend Foundation (Your Domain)
- **API Architecture:** Next.js Route Handlers (`app/api/...`).
- **Database:** MongoDB (using the `mongoose` ODM) hosted on MongoDB Atlas.
- **Authentication:** `next-auth` (Configured with both Google OAuth and Email/Password Credentials providers).
- **AI Integration:** `@google/generative-ai` (Gemini SDK).
- **File Parsing:** Native `request.formData()` (for handling file uploads in Next.js App Router) and `pdf-parse` (for extracting raw text).
- **Email & Jobs:** `resend` (for sending email reminders) and Vercel Cron Jobs (for triggering the daily reminder loop).

---

## Architecture Justification (Why Next.js?)

To satisfy academic requirements and ensure technical viability, we chose Next.js over a separated React/Express architecture for the following reasons:
1. **BFF (Backend for Frontend) Pattern:** Next.js Route Handlers allow us to keep our API routes in the same repository as the frontend, eliminating CORS issues and syncing friction between a two-person team.
2. **Server-Side Security:** Communicating with the Gemini API requires hiding the API key. Next.js provides a secure, serverless backend environment out-of-the-box, preventing client-side key exposure.
3. **Authentication Native Integration:** Implementing OAuth manually is highly complex. `next-auth` integrates natively into the Next.js App Router, securely handling JWTs and session states with minimal overhead.
4. **Developer Velocity:** By allowing Vercel and Next.js to handle the underlying routing and bundling infrastructure, we can dedicate 100% of our engineering hours to the unique business logic of the app (TDD, Gemini Prompting, and React Flow state).

---

## Database Schema (MongoDB)

We will define two primary Mongoose schemas:

### 1. User Schema
Stores authentication details and links to the user's saved mindmaps.
```javascript
{
  name: String,
  email: { type: String, unique: true },
  image: String,
  // Linked mindmaps
  mindmaps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mindmap' }]
}
```

### 2. Mindmap Schema
This is the core schema. It will exactly mirror the data structure required by React Flow so we can fetch it and render it immediately without complex transformations.
```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  topic: String,              // e.g., "React.js"
  timeframe: String,          // e.g., "1 week"
  language: String,           // e.g., "English"
  feasibilityWarning: String, // Populated if the AI detects an unfeasible timeframe
  createdAt: { type: Date, default: Date.now },
  
  // React Flow State
  nodes: [
    {
      id: String,       // Unique ID for the node
      type: String,     // Crucial for Hybrid: 'roadmap-step' OR 'mindmap-branch'
      data: { 
        label: String,  // The actual text/concept
        description: String // (Optional) The elaborated text from the AI
      }
    }
  ],
  edges: [
    {
      id: String,
      source: String,   // ID of the parent node
      target: String    // ID of the child node
    }
  ]
}
```

---

## Core API Routes to Build

1. `POST /api/auth/[...nextauth]`
   - Handles login and session management.
2. `POST /api/mindmap/generate`
   - **Input:** `{ topic: "...", file: [PDF Blob], timeframe: "1 week", verbosity: "detailed", language: "en" }`
   - **Process:** Parses the PDF. Prompts Gemini to generate the schema AND a `title`. **Crucially, we now auto-save to MongoDB here** to establish the `_id` immediately for To-Do creation. We also add `export const maxDuration = 60;` and strict prompt limits (e.g. "max 15 nodes") to avoid Vercel timeouts from heavy descriptions.
   - **Output:** Returns the newly saved MongoDB document (including the `_id`).
3. `GET /api/mindmap/share/:shareId`
   - **Process:** Securely fetches a mindmap for public viewing without a session, provided `isPublic` is true.
4. `POST /api/mindmap/elaborate`
   - **Input:** `{ nodeId: "123", concept: "Mitochondria", action: "expand" }`
   - **Process:** Calls Gemini to generate new branching child nodes for a specific concept. The output is passed through the shared `validateEdges()` helper function to prevent hallucinated edges.
   - **Output:** Returns validated new nodes/edges to append to the canvas.
5. `GET /api/mindmap` (and POST, PUT, DELETE)
   - Standard CRUD operations to save, load, and delete mindmaps from MongoDB.
6. `POST /api/todo` and `GET /api/cron/reminders`
   - **To-Do:** Generates a real `Date` by parsing the node's `timeMark` and adding that offset to the mindmap's `startDate` anchor. Standard CRUD for managing user tasks tied to a mindmap.
   - **Cron:** A secure endpoint pinged daily by Vercel Cron to check for due To-Dos and dispatch emails via Resend.


## Test-Driven Development (TDD) Workflow

As requested, all backend development will follow a strict TDD approach (Red-Green-Refactor). We will use **Jest** (or Vitest) and **Supertest** (for mocking API requests).

Once approved, our exact execution order will be:
1. Initialize the Next.js project and install testing dependencies (Jest, Supertest, MongoDB-memory-server for isolated DB testing).
2. **Phase 1 (Database):** Write tests for the Mongoose Schemas, specifically validating that the `type` field only accepts 'roadmap-step' or 'mindmap-branch'. Then, write the schema code to pass them.
3. **Phase 2 (API Routes):** Write tests for `/api/mindmap/generate` expecting 400 errors for missing inputs (like timeframe or topic), and mocked 200 successes. Then, write the route handlers.
4. **Phase 3 (AI Edge Cases & Validation):** Write tests to validate the JSON structure returned by Gemini. Specifically:
   - Mock a response where Gemini detects an unfeasible timeframe and ensure your code properly surfaces the `feasibilityWarning` string.
   - Mock a response where Gemini hallucinates an invalid edge ID. Write the ~10 lines of backend logic to filter out these orphaned edges before sending the response to the frontend.

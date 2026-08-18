# SecondMind API Documentation

Base URL: `/api`
Architecture: Next.js App Router (Route Handlers)

> [!NOTE]
> **PWA Offline Support:** The frontend caches `GET` responses locally via Zustand. If the user is offline, the frontend will serve the cached state and gracefully disable all `POST`, `PUT`, and `DELETE` requests to prevent data syncing conflicts.

---

## 1. Authentication

### `POST /auth/[...nextauth]`

Handles Google OAuth and Custom Credentials flows. Managed internally by `next-auth`.

### `POST /auth/register`

Creates a new user account with a hashed password using `bcryptjs`.

- **Content-Type:** `application/json`
- **Request Body (Required):**

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"password": "secure123"
}
```

- **Success Output (201 Created):** Returns user object (without password).

---

## 2. Core AI Generation

### `POST /mindmap/generate`

Generates a new Hybrid Roadmap.

- **Content-Type:** `multipart/form-data` (Important: Do not send as raw JSON)
- **Request Body (Form Data):**
  - `topic` (string, required) - e.g., "Docker"
  - `timeframe` (string, required) - e.g., "1 week"
  - `language` (string, required) - e.g., "English"
  - `verbosity` (string, optional) - e.g., "detailed" or "summary"
  - `file` (File, optional) - A `.pdf` or `.txt` file to extract context from

- **Backend Process:**
  1. Verifies NextAuth session via `getServerSession(authOptions)`.
  2. Captures input (`topic`, `timeframe`, `language`, `verbosity`, and `file`) via native `request.formData()`.
  3. **Context Extraction:** If a `.pdf` or `.txt` file is attached, extracts the text using `pdf-parse` or string buffer.
  4. Prompts Gemini SDK to generate the JSON structure, forcefully injecting the extracted document text into the AI context window.
  5. **Data Sanitization:** Passes the output through the `validateEdges()` helper.
  6. **Auto-Save:** Immediately saves the document to MongoDB.

- **Success Output (200 OK):**

```json
{
  "topic": "Docker",
  "feasibilityWarning": "Docker cannot be fully mastered in 1 day. This is a crash course.",
  "nodes": [
    {
      "id": "node-1",
      "type": "roadmap-step",
      "data": {
        "label": "Understand Containers",
        "description": "Containers are isolated environments that package your code...",
        "timeMark": "Day 1",
        "isCompleted": false
      }
    }
  ],
  "edges": [ ... ]
}
```

- **Error Output (400 Bad Request):** `{ "error": "Invalid file format. Please upload a PDF." }`
- **Error Output (413 Payload Too Large):** `{ "error": "PDF exceeds text extraction limit." }`

---

## 3. Canvas Interactivity

### `POST /mindmap/elaborate`

Generates new AI branches for a specific concept (Expand).

- **Content-Type:** `application/json`
- **Request Body (Required):**

```json
{
	"nodeId": "node-1",
	"concept": "Understand Containers",
	"action": "expand",
	"language": "English"
}
```

- **Success Output (200 OK):**

```json
{
	"newNodes": [
		{
			"id": "node-1-branch-1",
			"type": "mindmap-branch",
			"data": {
				"label": "Images vs Containers",
				"description": "An image is a read-only template, a container is a running instance.",
				"timeMark": null,
				"isCompleted": false
			}
		}
	],
	"newEdges": [
		{
			"id": "edge-1",
			"source": "node-1",
			"target": "node-1-branch-1"
		}
	]
}
```

### `POST /chat` (NEW)

Context-Aware AI Chat for a specific mindmap. The AI has access to the entire mindmap structure and short-term conversational history.

- **Content-Type:** `application/json`
- **Security:** Enforces strict `userId` ownership checking.
- **Request Body:**

```json
{
  "mindmapId": "64b5f8...",
  "message": "Can you give me an example of this concept?",
  "nodeId": "node-1" // Optional: Provide this if the user is typing from a specific node's drawer to give the AI exact context.
}
```

- **Backend Process:**
  1. Fetches the Mindmap to build the base context.
  2. If `nodeId` is provided, fetches the specific node's title and description and injects it as a hidden instruction.
  3. Fetches the last 6 messages from the `Message` collection to maintain conversational memory.
  4. Returns the AI's response as a single, formatted Markdown block.

- **Success Output (200 OK):**

```json
{
  "message": "Absolutely! The basic lifecycle of a container is..."
}
```

---

## 4. Dashboard & Canvas CRUD

### `GET /mindmap`

Fetches a lightweight list of all roadmaps for the User Dashboard.

- **Format:** `application/json` (Requires NextAuth Session)
- **Success Output (200 OK):**

```json
[
	{
		"_id": "64b5f8...",
		"title": "Learning Docker",
		"topic": "Docker",
		"timeframe": "1 week",
		"createdAt": "2026-08-15T12:00:00Z"
	}
]
```

### `GET /mindmap/:id`

Fetches the full Mindmap object (used for loading the canvas or read-only links).

- **Format:** `application/json`
- **Security:** Enforces strict `userId` ownership checking.
- **Success Output (200 OK):**

```json
{
  "_id": "64b5f8...",
  "userId": "user123...",
  "title": "Learning Docker",
  "topic": "Docker",
  "timeframe": "1 week",
  "language": "English",
  "feasibilityWarning": null,
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

- **Error Output (404 Not Found):** `{ "error": "Mindmap not found." }`

### `PUT /mindmap/:id`

Saves manual user edits (moved wires, deleted nodes).

- **Content-Type:** `application/json`
- **Request Body:**

```json
{
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

- **Success Output (200 OK):** `{ "success": true, "message": "Mindmap updated successfully." }`

### `DELETE /mindmap/:id`

- **Security:** Enforces strict `userId` ownership checking.
- **Process:** Deletes the Mindmap AND executes a cascading delete to remove all associated `Todo` objects from the database to prevent orphaned cron emails.
- **Success Output (200 OK):** `{ "success": true, "message": "Mindmap and associated todos deleted." }`

### `GET /mindmap/share/:shareId` (NEW)

- **Purpose:** Public endpoint for the Read-Only URL feature.
- **Auth:** No session required.
- **Backend Process:** Looks up the mindmap by `shareId` and verifies `isPublic === true`.
- **Success Output (200 OK):** Returns the full Mindmap object.

---

## 5. To-Do List & Reminders

### `POST /todo`

Creates a new task linked to a mindmap.

- **Content-Type:** `application/json`
- **Request Body (Required):**

```json
{
	"mindmapId": "64b5f8...",
	"taskText": "Read Docker documentation Chapter 1",
	"description": "Optional detailed description or combined branches.",
	"timeOffsetDays": 5
}
```

- **Success Output (201 Created):**

```json
{
	"_id": "todo789...",
	"taskText": "Read Docker documentation Chapter 1",
	"dueDate": "2026-08-16T10:00:00Z",
	"isCompleted": false,
	"emailReminderSent": false
}
```

### `POST /todo/generate` (NEW)

Auto-generates a list of To-Do tasks directly from the `roadmap-step` nodes in a specific Mindmap.

- **Content-Type:** `application/json`
- **Request Body (Required):**

```json
{
	"mindmapId": "64b5f8..."
}
```

- **Backend Process:**
  1. Finds all `roadmap-step` nodes.
  2. Finds their connected `mindmap-branch` nodes.
  3. Formats the descriptions of the branches into a Markdown bulleted list.
  4. Automatically calculates `dueDate` from the mindmap's `startDate`/`createdAt`.
  5. Skips generation if a task with the exact same `taskText` already exists.
- **Success Output (201 Created):** `{ "success": true, "generatedCount": 5 }`

### `GET /todo?mindmapId=64b5f8...`

Fetches all tasks for a specific mindmap.

- **Success Output (200 OK):** `[ { ...TodoObject }, { ...TodoObject } ]`

### `PUT /todo/:id`

Marks a task as complete.

- **Content-Type:** `application/json`
- **Request Body:** `{ "isCompleted": true }`
- **Success Output (200 OK):** `{ "success": true, "message": "Task updated." }`

### `DELETE /todo/:id`

Deletes a specific task from the To-Do list.

- **Security:** Enforces strict ownership checking (verifies the user owns the parent mindmap).
- **Success Output (200 OK):** `{ "success": true }`

### `GET /cron/reminders`

Protected endpoint pinged daily by Vercel Cron.

- **Headers Required:** `Authorization: Bearer <CRON_SECRET>`
- **Success Output (200 OK):**

```json
{
	"success": true,
	"emailsDispatched": 14,
	"message": "Cron job completed successfully."
}
```

- **Error Output (401 Unauthorized):** `{ "error": "Invalid Cron Secret." }`

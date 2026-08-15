# SecondMind API Documentation

Base URL: `/api`
Architecture: Next.js App Router (Route Handlers)

> [!NOTE]
> **PWA Offline Support:** The frontend caches `GET` responses locally via Zustand. If the user is offline, the frontend will serve the cached state and gracefully disable all `POST`, `PUT`, and `DELETE` requests to prevent data syncing conflicts.

---

## 1. Authentication
### `POST /auth/[...nextauth]`
Handles OAuth and Credentials authentication flows. Managed internally by `next-auth`.

---

## 2. Core AI Generation
### `POST /mindmap/generate`
Generates a new Hybrid Roadmap.

* **Format:** `multipart/form-data`
* **Inputs:**
  * `topic` (string): e.g., "Docker"
  * `timeframe` (string): e.g., "1 week"
  * `verbosity` (string): "concise" | "detailed"
  * `language` (string): e.g., "English"
  * `file` (File Blob): Optional PDF file upload.

* **Success Output (200 OK):**
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
        "timeMark": "Day 1"
      }
    }
  ],
  "edges": [ ... ]
}
```
* **Error Output (400 Bad Request):** `{ "error": "Invalid file format. Please upload a PDF." }`
* **Error Output (413 Payload Too Large):** `{ "error": "PDF exceeds text extraction limit." }`

---

## 3. Canvas Interactivity
### `POST /mindmap/elaborate`
Generates new AI branches for a specific concept (Expand).

* **Format:** `application/json`
* **Inputs:**
```json
{
  "nodeId": "node-1",
  "concept": "Understand Containers",
  "action": "expand",
  "language": "English"
}
```

* **Success Output (200 OK):**
```json
{
  "newNodes": [
    {
      "id": "node-1-branch-1",
      "type": "mindmap-branch",
      "data": {
        "label": "Images vs Containers",
        "description": "An image is a read-only template, a container is a running instance.",
        "timeMark": null
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

---

## 4. Dashboard & Canvas CRUD

### `GET /mindmap`
Fetches a lightweight list of all roadmaps for the User Dashboard.
* **Format:** `application/json` (Requires NextAuth Session)
* **Success Output (200 OK):**
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
* **Format:** `application/json`
* **Success Output (200 OK):**
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
* **Error Output (404 Not Found):** `{ "error": "Mindmap not found." }`

### `PUT /mindmap/:id`
Saves manual user edits (moved wires, deleted nodes).
* **Format:** `application/json`
* **Inputs:**
```json
{
  "nodes": [ ... ],
  "edges": [ ... ]
}
```
* **Success Output (200 OK):** `{ "success": true, "message": "Mindmap updated successfully." }`

### `DELETE /mindmap/:id`
* **Success Output (200 OK):** `{ "success": true, "message": "Mindmap deleted." }`

---

## 5. To-Do List & Reminders

### `POST /todo`
Creates a new task linked to a mindmap.
* **Format:** `application/json`
* **Inputs:**
```json
{
  "mindmapId": "64b5f8...",
  "taskText": "Read Docker documentation Chapter 1",
  "dueDate": "2026-08-16T10:00:00Z"
}
```
* **Success Output (201 Created):**
```json
{
  "_id": "todo789...",
  "taskText": "Read Docker documentation Chapter 1",
  "dueDate": "2026-08-16T10:00:00Z",
  "isCompleted": false,
  "emailReminderSent": false
}
```

### `GET /todo?mindmapId=64b5f8...`
Fetches all tasks for a specific mindmap.
* **Success Output (200 OK):** `[ { ...TodoObject }, { ...TodoObject } ]`

### `PUT /todo/:id`
Marks a task as complete.
* **Format:** `application/json`
* **Inputs:** `{ "isCompleted": true }`
* **Success Output (200 OK):** `{ "success": true, "message": "Task updated." }`

### `GET /cron/reminders`
Protected endpoint pinged daily by Vercel Cron.
* **Headers Required:** `Authorization: Bearer <CRON_SECRET>`
* **Success Output (200 OK):**
```json
{
  "success": true,
  "emailsDispatched": 14,
  "message": "Cron job completed successfully."
}
```
* **Error Output (401 Unauthorized):** `{ "error": "Invalid Cron Secret." }`

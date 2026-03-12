# Owlyn Interview System - API Integration Notes

### 1. Recruiting Area: Creating an Interview
When a recruiter sets up a new session, we fire off a `POST /api/interviews` call. 

**What we send (The Payload):**
```json
{
  "title": "e.g., Senior Fullstack Engineer",
  "candidateName": "John Doe",
  "durationMinutes": 45,
  "personaId": "uuid", // Optional custom AI personality
  "aiInstructions": "Focus on system design...",
  "generatedQuestions": "1. How do you scale...",
  "toolsEnabled": {
    "codeEditor": true,
    "whiteboard": false,
    "notes": true
  }
}

//mode is always interview here
```

---

### 2. Recruiting Area: Fetching the List
To show the dashboard, we call `GET /api/interviews`. 

**What we expect back (List Item):**
We get an array of objects that look like this:
```json
{
  "interviewId": "uuid",
  "title": "Senior Fullstack Engineer",
  "candidateName": "John Doe", 
  "accessCode": "123456",
  "status": "UPCOMING" // ACTIVE, COMPLETED, CANCELLED
}
```

---

### 3. Candidate Flow: Real vs. Practice
Candidates either enter a 6-digit code or choose a local mock session.

**Real Interview (Access Code):**
We call `POST /api/interviews/validate-code`. 
*   **Response from Backend:**
    *   `token`: Secure session token (we now store this using Electron's OS-level encryption).
    *   `livekitToken`: For the video call.
    *   `candidateName`: If the recruiter provided it.
    *   `title` & `durationMinutes`: To show in the lobby.

**Practice / Tutor Mode:**
*   **Behavior:** No backend validation is needed. 
*   **Frontend Logic:** We flag the session as `isPracticeMode`. This bypasses seat/token requirements and avoids calling "Lockdown" (full-screen/security restrictions) so candidates can test their hardware comfortably.
*   **Tutor Mode:** Currently acts like a Practice session but triggers a local flag to enable AI coaching in the editor.

### 4. Reports & Talent Pool
Recruiters can see past evaluations and individual performance breakdowns.

**All Reports (The List):**
Call `GET /api/reports`. We expect an array of summaries for the Talent Pool page.
```json
[
  {
    "reportId": "uuid",
    "interviewId": "uuid",
    "candidateName": "John Doe",
    "score": 85,
    "decision": "HIRE"
  }
]
```

**Individual Report (The Detail):**
Call `GET /api/reports/:id`. This is the most data-heavy request. The backend must aggregate session data into this final object:

```json
{
  "reportId": "uuid",
  "interviewId": "uuid",
  "candidateName": "John Doe",
  "score": 85,
  "behavioralNotes": "Candidate was calm but had frequent tab-switching events.",
  "codeOutput": "function helloWorld() { ... }", // Final state of the editor content from the Live stream
  "behaviorFlags": {
    "cheating_warnings_count": 3,
    "details": "Left tab (2x), Other face detected (1x)"
  },
  "transcript": [
    { "role": "ai", "text": "Hello, let's start with..." },
    { "role": "candidate", "text": "Sure, I'll use a Hashmap..." }
  ],
  "technicalHurdles": ["Recursion performance", "State management"],
  "humanFeedback": "Excellent problem solving skills.",
  "decision": "HIRE" // HIRE | DECLINE
}
```

#### 🛠 Backend Engineer Implementation Notes:
1.  **State Reconstruction**: Since the interview happens over WebSockets, the backend must save snapshots of the code editor state. The `codeOutput` returned here should be the **final version** of the code at the moment the session ended.
2.  **Alert Aggregation**: The `behaviorFlags.details` shouldn't just be raw logs. It should be a summarized string or a structured object that highlights exactly what triggered warnings during the session.
3.  **Persistence**: This data is typically generated once the interview is marked as `COMPLETED`. Until then, this endpoint might return a partial or "In Progress" state.
4.  **Score Logic**: The `score` (0-100) is calculated by the AI Agent based on the `technicalHurdles` and `transcript` analysis.

---

### 5. AI Personas
Recruiters can customize the AI's personality, knowledge level, and tone.

**Fetch Personas:**
Call `GET /api/personas`. Returns an array of available avatars/personalities.

**Create/Update Persona:**
Call `POST /api/personas`. 
*   **Format**: `multipart/form-data`
*   **Fields**: `name`, `systemPrompt`, `baseModel`, and optional `avatar` (image).
*   **Note**: The backend needs to process the file upload and store the `systemPrompt` which gets injected into the interview session.

---

### 6. Monitoring & Single Interview Fetch
The proctor needs to see exactly what’s happening in real-time.

**Fetch Single Interview:**
Before opening the socket, we call `GET /api/interviews/:id`. 
*   **Why?** We need to know the `title` and `candidateName` to label the monitor accurately.
*   **Access Point:** This is also used to confirm the proctor's token matches the session they are trying to watch.

**Live Monitoring (WebSockets):**
We connect to `/monitor?interviewId=...&token=...`.
*   **Real-time Streams:** The backend pushes `videoFrame` (base64) and `codeEditorText` updates.
*   **Proctor Alerts:** If the candidate leaves the tab or talks to someone, the backend pushes an `ALERT` type message which we log immediately in the event feed.

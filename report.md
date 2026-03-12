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

---



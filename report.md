# Backend guide for Owlyn

### 1. Workspace Profile Updates
Used for company branding.
- **ENDPOINT**: `PUT /api/workspace`
- **CONTENT-TYPE**: `multipart/form-data`
- **PAYLOAD DETAILS**:
  - `name`: `String` (Optional) - The display name of the workspace.
  - `logo`: `File` (Optional, Binary, Max 7MB) - The workspace logo image file.
- **BEHAVIOR**: 
  - If `logo` is omitted, the backend MUST NOT clear the existing logo.
  - Only updates fields provided in the `FormData`.

---

### 2. AI Persona update
- **ENDPOINT**: `PUT /api/personas/{id}`
- **CONTENT-TYPE**: `multipart/form-data`
- **PAYLOAD DETAILS**:
  - `persona`: `Blob/String` (Required) - A JSON string with the following exact keys:
    ```json
    {
      "name": "string",
      "tone": "MENTOR | ARCHITECT | INQUISITOR",
      "empathyScore": 30, // Integer 0-100
      "analyticalDepth": 90, // Integer 0-100
      "directnessScore": 10, // Integer 0-100 (Logic: 100 - Collaborative)
      "language": "string",
      "isAdaptive": true, // Boolean
      "domainExpertise": ["React", "Python", "Cloud"] // Array of strings
    }
    ```
  - `file`: `File` (Optional) - Training PDF or DOCX file for RAG.

---

### 3. Interview Session Lifecycle
**A. Creation** (POST `/api/interviews`)
```json
{
  "title": "string",
  "candidateName": "string",
  "candidateEmail": "string",
  "personaId": "uuid",
  "durationMinutes": 45,
  "toolsEnabled": {
    "codeEditor": true,
    "whiteboard": true,
    "notes": true
  }
}
when we send the tools enabled, send it back so we can show it to candidate.i.e if notes/whiteboard/editor is false, we would not show the component to candidate making the interview more dynamic
```

**B. Candidate Validation** (POST `/api/interviews/validate-code`)
- **PAYLOAD**: `{"code": "123456"}` (Exact 6-digit numeric string)
- **GRANULAR RESPONSE**:
```json
{
  "token": "string (Candidate Scope JWT)",
  "livekitToken": "string (WebRTC Room Token)",
  "candidateName": "string (The name provided during creation)",
  "personaName": "string (REQUIRED: The name of the AI persona)",
  "title": "string (The interview title)",
  "config": {
    "toolsEnabled": {
       "codeEditor": "boolean",
       "whiteboard": "boolean",
       "notes": "boolean"
    }
  }
}
```

---

### 4. B2C & Practice Sessions
Standalone endpoints for public/guest access.
- **GET /api/health**: Verified as the heartbeat endpoint for network RTT diagnostics.
- **POST /api/public/sessions/practice**:
  - **PAYLOAD**: `{"topic": "...", "difficulty": "...", "durationMinutes": 45}`
  - **RESPONSE**: Same signature as Candidate Validation (JWT + LiveKit Token).
- **POST /api/public/sessions/tutor**:
  - **PAYLOAD**: Empty.
  - **RESPONSE**: Same signature as Candidate Validation.
  - **UI FLAG**: `isTutorMode` should trigger the Electron widget/compact view.

---

### 5. Analytics & Top Performer
Consolidated dashboard intelligence.
- **ENDPOINT**: `GET /api/reports/top`
- **SCOPE**: Workspace-wide.
- **BEHAVIOR**: Returns the single highest AI-ranked report across all successfully completed interviews. Each report object MUST include `candidateName` and `candidateEmail`. Should be displayed exclusively on the `TalentPoolPage`.

---

### 6. Real-time LiveKit Data Channels
Exact JSON packets for the Python Data Plane -> Electron UI.
- **Proctoring**: `{"type": "PROCTOR_WARNING", "message": "Look at the camera"}`
- **Monaco Interaction**: `{"type": "TOOL_HIGHLIGHT", "line": 42}`
- **Transcript Sync**: `{"type": "transcript", "speaker": "ai|candidate", "text": "..."}`


other things to note

if a candidate quits the session, the backend should set the status to "completed", 

currently when a candidate quits the session, the code is unable to be used again(correct).

however the app is in a limbo state as it shows that the interview islive for admin but user cannot join.

now add a flow so when we click on end session, it should set the status to "completed".add an api endpoint for that.


running code in session does nothing


session doesnt work as intended, run locally to debug.


## setting fullscreen and no screencapture (frontend note)

To toggle between **Debug Mode** (current) and **Production Secure Mode** (Hard Gate), follow these steps:

### 1. Enable Fullscreen Lockdown
- **File**: `src/renderer/api/candidate.api.ts`
- **Action**: Locate `initiateLockdown` and uncomment:
  ```typescript
  if (window.owlyn?.lockdown) {
    await window.owlyn.lockdown.toggle(true);
  }
  ```

### 2. Enable Multi-Monitor Restriction
- **File**: `src/renderer/features/interview/InterviewPage.tsx`
- **Action**: In `publishMedia`, uncomment the `return` statement in the `getDisplayCount` check:
  ```typescript
  if (count > 1) {
    setMediaError("Multiple monitors detected...");
    return; // <--- Uncomment this
  }
  ```

### 3. Require Camera & Screen Share (Strict Proctoring)
- **File**: `src/renderer/features/interview/InterviewPage.tsx`
- **Action**: In `publishMedia`, uncomment the `return` and `setIsMediaReady(false)` lines in both the **Camera** and **Screen Share** catch blocks.
  - This prevents the "Start Secure Session" overlay from closing unless both tracks are successfully captured.
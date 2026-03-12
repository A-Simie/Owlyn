#  owls eyes: project owlyn sync notes

here's the raw details on what we've implemented and what the backend needs to handle. keeping it short.

### 1. the interview creation
When a recruiter sets up a session, they pick a persona.
- **POST** `/api/interviews`
- **Body**: 
  ```json
  {
    "title": "Role Name",
    "candidateName": "Canny Date",
    "personaId": "uuid", // MUST link to our persona lib
    "durationMinutes": 45,
    "toolsEnabled": { "codeEditor": true, "whiteboard": true }
  }
  ```
- **Returns**: `accessCode` (6-digits).

### 2. ai persona customization (multipart)
We send the config as a JSON blob inside a multipart form, plus the context doc.
- **POST/PUT** `/api/personas` (or `/api/personas/{id}`)
- **Format**: `multipart/form-data`
- **Key `persona`**: 
  ```json
  {
    "name": "The Architect",
    "roleTitle": "Lead Tech",
    "tone": "ARCHITECT",
    "analyticalDepth": 90,
    "empathyScore": 30, // 0-100 logic
    "language": "English",
    "isAdaptive": true
  }
  ```
- **Key `file`**: PDF/DOCX context.
- **Frontend catch**: If 400 on delete, it means it's linked to an interview - we show a block alert.

### 3. workspace & logo flow
Admin updates the company profile.
- **PUT** `/api/workspace`
- **Format**: `multipart/form-data`
- **Payload**:
  - `name`: String
  - `logo`: File (Max 7MB)
- **UI Fallback**: If `logoUrl` comes back empty/null, we generate initials (e.g., "Google" -> "GO").

### 4. candidate handshake
Davids entry point.
- **POST** `/api/interviews/validate-code`
- **Payload**: `{"code": "123456"}`
- **Response**: needs to include `personaName` so we can show "Interviewer: [Name]" in the lobby.
- **Lockdown**: the moment they hit "Enter Interview", we call **PUT** `/api/interviews/{code}/status/active`.

### 5. reports & the decision
After the session, the recruiter reviews the AI scorecard.
- **GET** `/api/reports` -> list all.
- **GET** `/api/reports/top` -> get the best one instantly for the spotlight.
- **Decision Flow**: **POST** `/api/reports/{id}/feedback`
  - **Body**: `{"humanFeedback": "...", "decision": "HIRE" | "DECLINE" | "PENDING"}`
  - Updates the `finalDecision` field which we use to color the talent pool list (Green/Red/Yellow).

### 6. educational modes (ephemeral)
Practice/Tutor shortcuts.
- **POST** `/api/public/sessions/practice` or `/api/public/sessions/tutor`
- **Returns**: Tokens for LiveKit.
- **Note**: Python AI skips the proctor for these.

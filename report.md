# 🦉 OWLYN SYSTEM: GRANULAR INTEGRATION SPEC

This is the definitive technical handshake. No fluff, just exact keys, types, and multipart structures.

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

### 2. AI Persona Management
Granular split between persona configuration (JSON) and training data (File).
- **ENDPOINT**: `POST /api/personas` or `PUT /api/personas/{id}`
- **CONTENT-TYPE**: `multipart/form-data`
- **PAYLOAD DETAILS**:
  - `persona`: `Blob/String` (Required) - A JSON string with the following exact keys:
    ```json
    {
      "name": "string",
      "roleTitle": "string",
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
  "personaId": "uuid",
  "durationMinutes": 45,
  "toolsEnabled": {
    "codeEditor": true,
    "whiteboard": true,
    "notes": true
  }
}
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

### 4. Real-time LiveKit Data Channels
Exact JSON packets for the Python Data Plane -> Electron UI.
- **Proctoring**: `{"type": "PROCTOR_WARNING", "message": "Look at the camera"}`
- **Monaco Interaction**: `{"type": "TOOL_HIGHLIGHT", "line": 42}`
- **Transcript Sync**: `{"type": "transcript", "speaker": "ai|candidate", "text": "..."}`

---

### ⏳ BRUTAL STATUS CHECK: THE ROAD TO MAR 16
| Module | Hackathon Spec | Implementation Status |
|:---|:---:|:---:|
| **Auth/Admin** | `doc-2.md` Phase 1/2 | ✅ **100% Solid** |
| **Workspace Profile** | `doc-2.md` Phase 2.2 | ✅ **95% Solid** (Multipart fix implemented) |
| **Persona Library** | `doc-2.md` Phase 2.4 | ✅ **95% Solid** (Multipart logic ready) |
| **Candidate Lobby** | `doc-2.md` Phase 3 | ✅ **100% Solid** |
| **Live Interview** | `doc-2.md` Phase 4/5 | ⚠️ **60% Solid** (Room connection works; Telemetry UI needs end-to-end test with Python) |
| **Tutor Mode** | `doc-2.md` Phase 7 | ⚠️ **40% Solid** (API endpoints ready, UI specialized view pending) |
| **JSON Reports** | `doc-2.md` Phase 6 | ⚠️ **30% Solid** (UI list done, generation logic still in backend) |

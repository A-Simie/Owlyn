# Technical Progress Report: Owlyn Frontend Implementation

## Frontend Core Architecture and State Management

The Owlyn frontend is architected as a high-performance React 18.3 application running within an Electron renderer process. The build system utilizes electron-vite for optimized compilation and HMR during development.

### State Management Strategy (Zustand)

We have implemented a decentralized state management system using Zustand to minimize re-renders in high-frequency data scenarios like the live interview session. Each store is designed for atomic updates and persistence where appropriate.

#### 1. Authentication Store (`auth.store.ts`)

Manages the global security context and recruiter session.

- **Key States**:
  - `token`: The current JWT for the Admin/Recruiter.
  - `user`: The User profile object (email, fullName, role).
  - `role`: Role enumeration (ADMIN, RECRUITER, CANDIDATE).
  - `hydrated`: A boolean flag indicating if the store has finished reading from disk.
- **Core Logic**:
  - `hydrate()`: An asynchronous function that reads the `owlyn_auth_v1` key from `localStorage`. It is called by the `AppGuard` and `WorkspaceGuard` to ensure the application state is consistent before rendering protected routes.
  - `setAuth(user, token)`: Updates both the in-memory state and the `localStorage` persist layer.
  - `clearAuth()`: Purges all session data and redirects the user to the login screen.
- **Implementation Detail**: Uses the `persist` middleware from Zustand to automatically sync the `token` and `user` keys to the browser's `localStorage` on every update.

#### 2. Media Store (`media.store.ts`)

Orchestrates raw hardware access for proctoring and interaction.

- **Key States**:
  - `cameraStream`: The active `MediaStream` object for the webcam.
  - `micStream`: The active `MediaStream` object for the microphone.
  - `audioLevel`: A normalized float (0.0 - 1.0) representing real-time volume.
- **Core Logic**:
  - `startCamera(deviceId?)`: Requests `navigator.mediaDevices.getUserMedia({ video: true })`. If a `deviceId` is provided, it uses the `{ exact: deviceId }` constraint.
  - `startMic(deviceId?)`: Initializes a new `AudioContext`. It creates a `MediaStreamSource` and connects it to an `AnalyserNode`. It calculates the Root Mean Square (RMS) of the frequency data every animation frame to update the `audioLevel` state.
  - `stopMic()`: Explicitly handles `audioCtx.close()` to prevent memory leaks and release the OS microphone lock.
- **Technical Context**: This store is the "Source of Truth" for all video/audio feeds in the app. Components like the `HardwarePage` and `InterviewPage` consume these streams directly.

#### 3. Interview Store (`interview.store.ts`)

Maintains the context of a live session.

- **Key States**:
  - `transcript`: An array of `TranscriptEntry` objects (`{ id, speaker, text, timestamp }`).
  - `currentQuestion`: The text of the active question being asked by the AI.
- **Core Logic**:
  - `addTranscript(entry)`: Appends new messages from the WebSocket. It uses the `timestamp` for ordering and ensures that duplicate packets from the server are ignored.
  - `setCurrentQuestion(text)`: Synchronizes the "Focus Area" of the UI with the AI's current topic.

#### 4. Session Store (`session.store.ts`)

Tracks the temporal metrics of an active interview.

- **Key States**: `elapsedSeconds`, `isActive`, `startTime`.
- **Core Logic**:
  - `tick()`: Increments `elapsedSeconds`. This function is typically mapped to a `setInterval` in the `InterviewPage` component, ensuring the session timer is accurate to the second.
  - `reset()`: Wipes the session metrics when the candidate exits the interview room.

#### 5. Settings Store (`settings.store.ts`)

Persists organizational and peripheral preferences.

- **Key States**: `selectedCameraId`, `selectedMicId`, `notificationsEnabled`, `interviewReminders`, `autoRecordConsent`, `dataRetention`.
- **Core Logic**: Synchronizes user hardware preferences across sessions. This store is primarily updated in the `SettingsPage` but consumed by the `HardwarePage` or the `InterviewPage` on mount.

---

## Technical Feature & Module Breakdown

### 1. Unified Authentication System

The authentication system is split between recruiter-managed organization access and candidate-managed session access.

#### `LoginPage.tsx` Implementation Deep-Dive

- **Role Switching**: Uses a local boolean `isCandidate` to toggle the entire view.
- **Refactoring Note**: The component handles both the email/password flow and the 6-digit access code flow within a single file to share design tokens and layout constraints.
- **OTP Logic**: The `step === 'otp'` logic is triggered after a successful `authApi.initiateLogin` call. The UI uses a simplified 6-digit entry that triggers `authApi.verifyLogin` on the `submit` event.
- **Candidate Validation**:
  - `handleValidateCode` calls `candidateApi.validateCode(code)`.
  - **Success Branch**: On 200 OK, the returned `GuestToken` is stored in the `localStorage` key `owlyn_guest_token`.
  - **Navigation**: Redirects to `/hardware` instead of `/dashboard`.

#### `SignupPage.tsx` Implementation Deep-Dive

- **Workspace Configuration**: Recruiters can define a "Workspace Name" during signup.
- **Flow**:
  1. Enter Email, Pass, Name, Workspace.
  2. Call `POST /api/auth/signup`.
  3. Verify OTP.
  4. Auto-login on verification completion.

### 2. Candidate Journey Modules

#### `HardwarePage.tsx` Implementation Deep-Dive

- **Core Hook**: `useMediaStore` is the primary driver.
- **Diagnostics**:
  - **Camera**: Validates that `cameraStream` is non-null and the `videoTrack.enabled` is true.
  - **Microphone**: Validates `micStream` and subscribes to the `audioLevel` state. If `audioLevel > 0.1` for 1000ms, the mic is marked as "Active".
  - **Network**: Measured via the `performance.now()` delta of the `GET /api/health` call.
- **UI State**: Prevents the candidate from proceeding unless all three checkmarks are green.

#### `LobbyPage.tsx` Implementation Deep-Dive

- **Session Bridge**: Acts as a state bridge between the public gateway and the locked interview environment.
- **Information**: Displays the specific AI Persona that will be conducting the interview, along with the expected duration.
- **Preparation Delay**: Implements a 2-second artificial loading state ("Securing Connection...") which is required to ensure standard Browser/Electron audio-context-unlock policies are met.

#### `InterviewPage.tsx` Engineering (The "Engine")

- **Layout Architecture**: Uses a flexbox-based grid to divide the screen between the "Agent Sidebar" (Right) and the "Interactive Workspace" (Left).
- **Tabbed Workspace**:
  - **Monaco Editor**: Integrated via `@monaco-editor/react`. The model content is sent to the backend every 1 second in the `wsService.sendMedia` packet.
  - **Whiteboard**: Currently a 2D canvas placeholder that allows free-form sketching.
  - **Notes**: A local persistence module that stores textual thoughts without sending them to the AI proctoring service.
- **WS Integration**:
  - `useEffect` establishes the connection on mount using the Guest JWT.
  - `wsService.onMessage` registers three handlers for `transcript`, `inlineData`, and `PROCTOR_WARNING`.

### 3. Recruiter Administration & Workspace Control

#### `InterviewsListPage.tsx` Implementation Deep-Dive

- **Data Fetching**: Uses `interviewsApi.getInterviews()` which returns an array of `InterviewListItem`.
- **Status Pills**:
  - **UPCOMING**: Allows copying the access code to the clipboard.
  - **ACTIVE**: Shows an "Animate Pulse" button to join the monitoring view.
  - **COMPLETED/CANCELLED**: Disables interaction buttons, only showing "Results".
- **Question Generator Modal**:
  - Integrated with `interviewsApi.generateQuestions`.
  - Uses a two-step state (`'info' | 'questions'`) to allow the recruiter to review AI-generated drafts.

#### `AgentCustomizationPage.tsx` Implementation Deep-Dive

- **Personality Modeling**:
  - Three sliders: `strictness`, `analytical`, `collaborative`.
  - **Logic**: These are sent as numeric values in the `createPersona` payload, which the backend uses to tune the system prompt for the AI agent.
- **RAG Knowledge Base**:
  - Supports PDF and TXT uploads.
  - Uses `multipart/form-data` via the `personasApi.createPersona` method.
  - **UI**: Lists uploaded "Context Files" in a card view within the creation form.

#### `SettingsPage.tsx` Implementation Deep-Dive

- **Device Management**: Provides a manual peripheral selection UI. It calls `navigator.mediaDevices.enumerateDevices()` to populate selects and updates `useSettingsStore`.
- **Organizational Control**:
  - **Member Management**: Administrators can invite members via email (`workspaceApi.inviteMember`). The backend returns a temporary password which the frontend displays in a secure modal.
  - **Workspace Metadata**: Allows updating the Workspace Name and Logo URL (`workspaceApi.updateWorkspace`).
- **Privacy Controls**: Toggles for `autoRecordConsent` and dropdown for `dataRetention` policies (30 days to 1 year).

#### `TalentPoolPage.tsx` Implementation Deep-Dive

- **Evaluation Dashboard**: Centralizes all historical interview reports via `reportsApi.getAllReports()`.
- **Filtering Logic**:
  - Implements a reactive filtering system for AI Score Range (0-100%), Candidate Role, and Status (Highly Recommended vs Under Review).
  - **Talent Spotlight**: A computed state that identifies the top-performing candidate (highest AI rank) and highlights them in a dedicated sidebar card.
- **Data Export**: Features a JSON export function that serializes the current filtered candidate list for external recruitment pipelines.

### 4. Post-Session Intelligence

#### `AnalysisPage.tsx` Implementation Deep-Dive

- **Report Polling**:
  - Because the AI (Agent 4) takes time to generate reports, this page implements a recursive `fetchReport` function with a `retryCount < 5` limit and a 3-second delay.
- **Quantitative Scorecard**: Displays the AI's final score (0-100) and integrity flags.
- **Human Decision**: A toggle for "Hire" or "Decline" which maps to a final `POST /api/reports/{id}/feedback` sync.

---

## Internal Technical Registry (Services & Schemas)

### 1. `ws.service.ts` (Persistent Real-time Pipeline)

- **Token Passing**: Appends `?token=...` to the WSS URL.
- **Schema Validation**:
  ```typescript
  const result = WsIncomingMessageSchema.safeParse(data);
  if (result.success) {
    this.emitter.emit(result.data.type, result.data);
  }
  ```
- **Reconnection**: Handled by a 5-attempt retry loop with exponential backoff.

### 2. `playback.service.ts` (AI Vocalization)

- **Buffer Management**: Incoming Base64 PCM data is decoded via `audioCtx.decodeAudioData`.
- **Scheduling**: Uses the `AudioContext` clock to precisely time the playback of sequential audio chunks, ensuring the response sounds natural and uninterrupted.

### 3. `video.service.ts` (Proctoring Capture)

- **Logic**: Every 1000ms, it captures a frame from the live video track.
- **Compression**: Converts to `image/jpeg` at 0.4 quality to minimize network usage while maintaining AI visibility for "Agent 2" (Eye).

---

## Shared Schema Contracts (Zod)

Located in `src/shared/schemas/`, these define the strict JSON boundaries between frontend and backend.

### `ws-messages.schema.ts`

- **`WsOutgoingMedia`**: `{ event: 'MEDIA', videoFrame: string, codeEditorText?: string }`
- **`WsIncomingTranscript`**: `{ type: 'transcript', speaker: 'ai'|'candidate', text: string }`
- **`WsProctorWarning`**: `{ type: 'PROCTOR_WARNING', message: string }`

### `interview.schema.ts`

- **`CreateInterviewPayload`**: `{ title, durationMinutes, toolsEnabled, personaId }`
- **`Report`**: `{ score, behavioralNotes, status, candidateName }`

---

## Implementation Status & Known Mocked Logic

### Operational (Phase 1-6 Ready)

- Recruiter/Admin OTP Authentication & Workspace Management.
- Member invitation and organizational settings.
- Candidate access code validation.
- Live multimodal interview (Video/Audio/Code/Transcript).
- AI Persona definition and Knowledge base RAG uploads.
- Talent Pool aggregation and high-potential spotlighting.
- Post-interview analysis scorecard with recursive polling.

### Mocked / Pending Logic

- **Network Diagnostic**: Fallback random ping values if backend health is unreachable.
- **Lobby Readiness**: 2000ms hardcoded delay before starting a session.
- **Live Monitoring (Phase 6)**: The `MonitoringPage` UI is a visual frame with static data relay placeholders.
- **Analysis Metrics**: Radar charts and competency diagrams are currently static SVG components awaiting dynamic mapping from the Agent 4 report payload.

### Implementation Checklist Table

| Feature               | Status     | Technology used             |
| :-------------------- | :--------- | :-------------------------- |
| **Auth**              | Functional | REST                        |
| **Workspace Control** | Functional | REST / Zustand Settings     |
| **Media Check**       | Functional | MediaDevices / AudioContext |
| **Lobby**             | Functional | LocalStorage / Mock Delay   |
| **Streaming**         | Functional | WebSockets / PCM / Base64   |
| **AI Question Gen**   | Functional | REST / Gemini Flash         |
| **Reports**           | Functional | REST / Gemini Pro 3.1       |
| **Talent Archiving**  | Functional | REST / TanStack Query       |
| **Live Monitor**      | UI Only    | -                           |

---

## Mocked and Guessed API Registry

The following endpoints and data structures are currently implemented in the frontend but are either missing from the official documentation (`api-doc.md`, `progression_flow.md`) or deviate from the specified contracts. These are considered "guessed" or "faked" for development purposes.

### 1. Guessed REST Endpoints

| Endpoint                              | File                | Documentation Status | Actual Documented Alternative                                           |
| :------------------------------------ | :------------------ | :------------------- | :---------------------------------------------------------------------- |
| `GET /api/reports`                    | `reports.api.ts`    | **Missing**          | None (Bulk reports not in Phase 1-6 docs).                              |
| `POST /api/interviews/${id}/finalize` | `interviews.api.ts` | **Missing**          | `POST /api/reports/${id}/feedback`                                      |
| `DELETE /api/personas/${id}`          | `personas.api.ts`   | **Missing**          | Phase 2.5 only specifies GET and POST.                                  |
| `GET /api/interviews/${id}`           | `interviews.api.ts` | **Inconsistent**     | Specified in `progression_flow` but missing detailed body in `api-doc`. |

### 2. Payload & Schema Discrepancies

- **Decision Sync Gap**: The `AnalysisPage` UI allows recruiters to select "Recommend Hire" or "Decline" (`decision: "HIRE" | "DECLINE"`). However, the implemented `reportsApi.addFeedback` only transmits the `humanFeedback` string to the server as per the current backend specs. The choice of HIRE/DECLINE is currently a **local-only UI state** and is not persisted to the database.
- **Talent Pool Data**: The `GET /api/reports` (bulk) endpoint used in `TalentPoolPage.tsx` is a total guess. Neither `api-doc.md` nor `progression_flow.md` provide an endpoint for cross-interview report aggregation.
- **Live Monitoring WebSocket**: `api-doc.md` (Phase 6) specifies `ws://localhost:8080/monitor?interviewId=<UUID>&token=<Admin_JWT>`. The current `MonitoringPage.tsx` implements a mocked UI but **lacks the actual WebSocket implementation** to relay live candidate frames and alerts.
- **Persona Deletion**: The `DELETE /api/personas/${id}` call in `personas.api.ts` is speculative. The official documentation only covers list and create operations for AI personas.

### 3. Faked Temporal Logic

- **Report Polling**: The frontend implements a 3-second recursive polling delay on the Analysis page while waiting for the AI scorecard. While the documentation mentions "retry every 3 seconds" (Phase 7), this logic is applied as a guess to all report retrievals including Phase 5 results.
- **Candidate Handshake**: The 2000ms "Securing Connection" delay in `LobbyPage.tsx` is an artificial UI buffer and does not correspond to a specific backend state-machine transition in the current specs.

---

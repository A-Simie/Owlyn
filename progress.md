# Owlyn: Comprehensive Engineering Progress & Technical Architecture Report

**Version:** 1.1.0-stable-refactor  
**Last Updated:** March 9, 2026  
**Document Ownership:** Frontend/Electron Architecture Team

---

## 1. System Overview & Core Philosophy

Owlyn is a high-fidelity, Electron-native AI Interview platform. Unlike standard web-based platforms, Owlyn leverages OS-level hooks via Electron's Main Process to enforce strictly proctored sessions while maintaining a fluid, high-performance recruiter dashboard.

**Key Architectural Decisions:**

- **Context-Less State**: We use Zustand stores to avoid React's re-render overhead in media-heavy environments.
- **Main/Renderer IPC**: High-security actions (Lockdown, Content Protection) are isolated in the Main process.
- **WSS Synchronization**: Real-time evaluation is decoupled from REST, using a specialized Websocket protocol for media and transcript packets.

---

## 2. Comprehensive Flow Analysis

### 2.1 Authentication & Persistence Flow

**The "Secure Session" Chain:**

1. **Login (`LoginPage.tsx`)**: User submits credentials.
   - **API**: `authApi.login(payload)` returns `User` and `JWT`.
   - **Process**: `authStore.setAuth()` saves the user in memory and triggers `window.owlyn.auth.saveToken(token)`.
2. **Persistence (`main/preload`)**: The token is piped to the Electron Main process and encrypted using the OS-native Keychain (`safeStorage.encryptString`).
3. **Hydration**: On application cold-boot, `authStore.hydrate()` calls the Main process to decrypt the token. If valid, the user is navigated directly to the `/dashboard`.

**Mocks/Stubs in this flow:**

- **None**. This is fully integrated with the Java Cloud Backend.

---

### 2.2 Interview Creation & AI Orchestration

**The "Recruiter Strategy" Chain:**

1. **Definition (`InterviewsListPage.tsx`)**: Recruiter sets Title, Duration, and Persona.
2. **AI Question Generation**:
   - **The Bridge**: The recruiter clicks "Generate Questions".
   - **Service**: `interviewsApi.generateQuestions()` calls the backend which bridges to Gemini 3.0 Flash.
   - **Drafting**: The result is returned as a plain-text draft. The recruiter can live-edit this in a monospaced `<textarea>` before it is permanently committed to the backend.
3. **Finalization**: `interviewsApi.createInterview()` commits the metadata and questions.

**Mocks/Stubs in this flow:**

- **Stub**: In `InterviewsListPage.tsx`, the `durationMinutes` input allows clearing, but the backend currently enforces a minimum of 5 minutes during validation.

---

### 2.3 The Candidate Lockdown & Entry Flow

This is where the Electron-specific security features are most prominent.

1. **Access Code Validation**: `candidateApi.validateAccessCode` converts a human-readable code into a temporary `guest_token`.
2. **Hardware Verification (`HardwarePage.tsx`)**:
   - Uses `MediaStore.ts` to request camera/mic permissions.
   - The `MediaStream` is kept in a global store and shared between indices.
3. **Lockdown Execution (`LobbyPage.tsx`)**:
   - **IPC Signal**: `window.owlyn.lockdown.toggle(true)` is sent.
   - **OS Mutation**: `main.ts` executes `mainWindow.setContentProtection(true)` and enters `kiosk` mode.
   - **Proctoring Start**: `candidateApi.initiateLockdown` is called to signal the backend that the candidate is now "Trapped" in the evaluation environment.

**Mocks/Stubs in this flow:**

- **Stub**: The `LobbyPage.tsx` "Synchronizing" progress bar is a UI-only simulation (`setTimeout`). Real integration would require a `READY` event from the WSS before navigation.

---

### 2.4 Real-time Interview Session (`InterviewPage.tsx`)

The engine of the app, coordinating 4 concurrent data streams.

#### Loop A: Optical Uplink (1FPS)

- **Logic**: Every 1000ms, a canvas snapshot of the local `video` element is taken.
- **Packet**: A Base64-encoded JPEG is piped via `wsService.sendMedia(frame)`.
- **Purpose**: Low-bandwidth proctoring.

#### Loop B: AI Vocal Downlink

- **Source**: Backend pipes `inlineData` packets (PCM-encoded Base64 audio).
- **Service**: `audioPlaybackService.ts` receives chunks and plays them via a Web Audio API buffer.
- **Sync**: Triggers the `isAITalking` animation in the UI.

#### Loop C: Live Transcript & Interaction

- **Packet**: `wsService` receives `transcript` events.
- **State**: These are added to `interviewStore.transcript` array with timestamps.
- **UI**: Displayed as a "Recruit-Sleek" chat bubbles on the right sidebar.

#### Loop D: Workspace Sync

- **Code Editor**: Monaco (or equivalent) text changes are debounced and sent via `MEDIA` event as `codeEditorText`.
- **Whiteboard**: Canvas coordinates are transmitted periodically.

**Mocks/Stubs in this flow:**

- **Mock**: The "Finalize Session" redirection in `InterviewPage.tsx` currently navigates to `/analysis` without checking if the backend has finished processing the final report packet.

---

### 2.5 Monitoring & Live Observation (`MonitoringPage.tsx`)

For recruiters to observe sessions in progress.

1. **Mirroring**: Uses `interviewsApi.getInterview(id)` for initial metadata.
2. **WSS Feed**: Subscribes to the same WSS room as the candidate.
3. **Uplink Capture**: Displays the 1FPS feed as a "Satellite Link" visual.

**Mocks/Stubs in this flow:**

- **Stub**: "Terminate Session" is currently a frontend-only navigation. It does not yet tell the backend to invalidate the candidate's active socket.

---

### 2.6 Post-Interview Analysis (`AnalysisPage.tsx`)

1. **Aggregated Insights**: Fetches the processed AI sentiment and scoring.
2. **Retrospective hiring**: Recruiter submits a `HIRE` or `DECLINE` decision via `interviewsApi.finalizeReport`.

**Mocks/Stubs in this flow:**

- **Mock**: The "Competency Radar" and "Interview Transcript Preview" currently use constant data objects (`MOCK_TRANSCRIPT`). The backend API for granular competency scores is currently in development.

---

## 3. Storage & State Management Matrix

| Store            | Purpose                            | Sync Method                  |
| ---------------- | ---------------------------------- | ---------------------------- |
| `authStore`      | Session and Role management        | Persistence via Main Process |
| `interviewStore` | Transcripts and live questions     | WSS / REST Hybrid            |
| `mediaStore`     | Camera/Mic stream management       | Native MediaDevices          |
| `sessionStore`   | Elapsed time and proctoring status | Local Timer                  |
| `settingsStore`  | App-wide UI preferences            | LocalStorage                 |

---

## 4. Known Technical Debt & High Priority Gap Analysis

1. **Analytics Dashboard (`TalentPoolPage.tsx`)**:
   - **Status**: The entire dashboard (Charts, Metrics, Table) is currently **Mocked** with `INITIAL_CANDIDATES`.
   - **Reason**: We are awaiting the implementation of the `/api/analytics` aggregate service in the Java Cloud.
2. **WSS Resilience**:
   - **Gap**: If a user refreshes the app mid-interview, the WSS restarts from scratch.
   - **Solution**: We need to implement a `RECONCILE` handshake that fetches the current transcript history upon reconnection.
3. **Hardware Fallbacks**:
   - **Gap**: If a candidate's camera fails mid-way, the proctoring engine doesn't currently auto-pause the session.
4. **Lockdown Hardening**:
   - **Gap**: Content protection works on macOS/Windows, but we need a Linux alternative using `X11` or `Wayland` specific protocols for full parity.

---

## 5. Development Infrastructure

- **Server Connectivity**: Decoupled environment variables used in `.env` for `VITE_API_BASE_URL` and `VITE_WS_URL`.
- **Error Handling**: Standardized via `extractApiError` utility to ensure clean error messages in the UI toast system.
- **Copy Engine**: New high-reliability clipboard tool with fallback to hidden `<textarea>` to ensure access codes are always capturable on different OS versions.

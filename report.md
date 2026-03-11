# Implementation Gaps & Mock Registry: Owlyn Frontend

This document outlines the remaining technical debt, mocked logic, and documentation discrepancies in the Owlyn frontend. It serves as the primary checklist for "Closing the Loop" on the Phase 1-9 implementation.

## 1. Core Implementation Gaps (Incomplete Features)

### 1.1 Evaluation Radar Charts (Phase 8)

- **Status**: **PENDING**
- **Gap**: The competency radar charts in `AnalysisPage.tsx` currently map to static placeholder points.
- **Requirement**: Implement the `RadarChart` component mapping logic to iterate over the `competencies` object in the session report.

---

## 2. Mocked Logic Registry

The following modules utilize hardcoded delays or simulated data to bypass missing backend orchestration.

| Module           | Mocked Logic Description   | Current Workaround                                                                                              |
| :--------------- | :------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **HardwarePage** | Network Latency Diagnostic | Uses `performance.now()` on `/api/health` but fallbacks to `Math.random() * 20` if the endpoint is unreachable. |
| **AnalysisPage** | Competency Radar Charts    | UI currently lacks visual breakdown; radar-chart components are **PENDING** integration with the report state.  |
| **TalentPool**   | Talent Spotlight           | Top-performer identification is done purely client-side; ideally, this is a server-side indexed query.          |

---

## 3. Documentation & API Discrepancies

These items refer to code that is functional but deviates from or is missing from `api-doc.md` and `progression_flow.md`.

### 3.1 Bulk Reports API (`/api/reports`)

- **File**: `reports.api.ts`
- **Issue**: The `getAllReports()` method used in the Talent Pool is speculative. The Phase 1-6 documentation only specifies single-report retrieval.
- **Action**: Verify if bulk aggregation should be handled by a dedicated `GET /api/candidates` or similar endpoint.

### 3.2 Decision Synchronization

- **File**: `AnalysisPage.tsx`
- **Issue**: The HIRE/DECLINE toggle state is synchronized via `reportsApi.addFeedback`, but this endpoint is only documented to accept a `humanFeedback` string.
- **Status**: The `decision` field is currently passed as an extra parameter; backend support for this field needs verification.

### 3.3 Persona Deletion (`DELETE /api/personas/${id}`)

- **File**: `personas.api.ts`
- **Issue**: Speculative endpoint. Documentation only defines GET (list) and POST (create) operations.
- **Status**: Implemented in frontend but likely to error if the backend follows the strict documentation.

---

## 4. Pending Security Hardening (Phase 9)

While the **Environment Breach** (Window Blur) logic is implemented, the following proctoring "Aggressive" modes remain pending:

- **Global Keyhook Trap**: (Phase 3.4) Preventing Alt+Tab or Cmd+Space at the OS level (requires native Electron `globalShortcut` registration which is currently only toggling Window state).
- **Secondary Display Detection**: Identifying if multiple monitors are connected and forcing single-monitor use during proctored sessions.

---

## 5. Implementation Status Table (Summary)

| Category           | Status | Remaining Task                                            |
| :----------------- | :----- | :-------------------------------------------------------- |
| **Authentication** | 100%   | Biometric Calibration & Identity Sync implemented.        |
| **Streaming**      | 100%   | Whiteboard delta synchronization integrated.              |
| **Proctoring**     | 90%    | Global OS-level shortcut trapping.                        |
| **Admin Tools**    | 100%   | Interview Settings (Lang/Adaptive) implemented.           |
| **Analytics**      | 60%    | Dynamic radar mapping & bulk report API verification.     |
| **Multi-Mode**     | 100%   | TUTOR mode source selection modal implemented.            |

---

## 6. Recently Implemented: Persona Interview Settings

- **Feature**: Language & Adaptive Mode Selection.
- **Frontend**: Implemented a responsive grid-styled selection interface in `AgentCustomizationPage.tsx`.
- **UI Polish**: 
    - Corrected dropdown alignment and positioning.
    - Standardized button states (Yes/No) to use the primary yellow accent when active for better UX clarity.
- **Schema**: Updated `persona.schema.ts` to include `language` and `isAdaptive` in the creation payload.
- **Request Body (JSON)**:
```json
{
  "name": "Senior Technical Interviewer",
  "roleTitle": "Software Engineer",
  "empathyScore": 85,
  "analyticalDepth": 90,
  "directnessScore": 70,
  "tone": "Professional",
  "domainExpertise": ["Java", "System Design"],
  "language": "English",
  "isAdaptive": true
}
```

---

## 7. Infrastructure Upgrade: LiveKit Transition

- **Status**: **COMPLETE**
- **Migration**: Replaced legacy WebSocket (`ws.service.ts`) with **LiveKit (WebRTC)**.
- **Key Enhancements**:
    - **Native Media**: Automatic publishing of high-quality microphone and screen-share tracks.
    - **Data Channels**: Use of LiveKit's reliable data packets for `RUN_CODE` and `PROCTOR_WARNING` events.
    - **Stability Fixes**:
        - Resolved **403 Forbidden** errors by implementing guest-token detection in the API interceptor.
        - Fixed **Monaco Editor crashes** (`disposeInlineCompletions` error) by satisfying the provider interface.
        - Simplified AI Copilot to a clean HTTP-based debounced engine.

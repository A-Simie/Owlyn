# Owlyn

**Live Multimodal AI Interview System**

Owlyn is a desktop application that conducts real-time AI-powered interviews with live video, audio, and face tracking. Built for enterprise hiring teams to standardize technical interviews, detect candidate engagement, and generate structured performance analysis.

## Features

- **Live AI Interviews** — Real-time conversation with an AI interviewer via WebSocket streaming
- **Face & Eye Tracking** — Chromium FaceDetector API overlays an adaptive oval that follows the candidate's face shape, with individual eye landmark tracking and gaze triangle visualization
- **Hardware Diagnostics** — Pre-interview system check for camera, microphone, network latency, and power
- **Interview Management** — Schedule, track, and review past interviews with score breakdowns
- **AI Persona Customization** — Configure interviewer personality, question domains, and difficulty
- **Candidate Analysis** — Post-interview performance reports with transcript review
- **Talent Pool Dashboard** — Aggregate candidate data across interview sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 33 |
| Build System | electron-vite + Vite |
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Data Fetching | TanStack React Query, Axios |
| Routing | React Router DOM v7 |
| Validation | Zod |
| Animation | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── main/             # Electron main process
│   └── main.ts       # Window creation, permissions, menu
├── preload/          # Context bridge
│   └── preload.ts
├── renderer/         # React frontend
│   ├── components/   # Shared UI (Sidebar, AppLayout)
│   ├── features/     # Page-level features
│   │   ├── auth/        # Sign-in
│   │   ├── hardware/    # Device diagnostics
│   │   ├── lobby/       # Pre-interview readiness check
│   │   ├── interview/   # Live session with face tracking
│   │   ├── interviews/  # Interview list & scheduling
│   │   ├── analysis/    # Post-interview report
│   │   ├── agent/       # AI persona config
│   │   ├── talent/      # Talent pool dashboard
│   │   ├── settings/    # App settings
│   │   └── landing/     # Landing page
│   ├── stores/       # Zustand state (media, session, auth)
│   ├── services/     # WebSocket, audio capture, playback
│   └── lib/          # API client, query config
└── shared/           # Zod schemas shared across processes
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |

## License

Proprietary. All rights reserved.

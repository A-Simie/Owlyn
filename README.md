# Owlyn

A live multimodal AI interview system that conducts real-time AI-powered interviews with live video, audio, and face tracking. Built for enterprise hiring teams to standardize technical interviews, detect candidate engagement, and generate structured performance analysis.

## Features

### Live Multimodal Interviews

- **Real-time Conversation** - Low-latency WebSocket streaming for instant AI responses
- **Embedded Tools** - Integrated Code Editor, Whiteboard, and Notes during the session
- **Hardware Diagnostics** - Pre-interview checks for camera, microphone, and network

### AI-Powered Proctoring

- **Face & Eye Tracking** - Chromium FaceDetector API for real-time gaze visualization
- **Lockdown Mode** - Secure environment preventing unauthorized resource access
- **Candidate Analysis** - Automatic post-interview reports with transcripts and metrics

### Customization & Tracking

- **AI Persona** - Tailor the interviewer's personality, domains, and difficulty level
- **Talent Pool** - Dashboard for managing candidate pipelines and interview schedules

## Tech Stack

### Desktop Core

- **Electron 33** - Cross-platform desktop shell environment
- **electron-vite + Vite** - High-performance build system

### Frontend Structure

- **React 18** + **TypeScript** - Strongly typed UI layer
- **Tailwind CSS** - Utility-first styling framework
- **Framer Motion** - Fluid animations and transitions

### State & Communication

- **Zustand** - High-performance atomic state management
- **@tanstack/react-query** - API state management and caching
- **WebSockets** - Real-time continuous media chunk streaming
- **Zod** - Runtime type validation for shared schemas

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Execute TypeScript type checking
npm run typecheck
```

## Project Structure

```bash
src/
├── main/             # Electron main process (Windows, Menus, IPC)
├── preload/          # Context bridge (Safe API exposure)
├── renderer/         # React Application
│   ├── components/   # Shared UI (Sidebar, AppLayout, Guards)
│   ├── features/     # Feature-level modules
│   │   ├── auth/        # Sign-in & Authentication
│   │   ├── hardware/    # Device diagnostics
│   │   ├── lobby/       # Pre-interview readiness check
│   │   ├── interview/   # Live session with face tracking
│   │   ├── interviews/  # Interview list & scheduling
│   │   ├── analysis/    # Post-interview reports & charts
│   │   ├── agent/       # AI persona configuration
│   │   ├── talent/      # Talent pool dashboard
│   │   ├── settings/    # Application settings
│   │   └── landing/     # Initial landing page
│   ├── services/     # Core logic (WebSocket, Audio/Video handling)
│   ├── stores/       # Zustand state stores
│   ├── lib/          # Utilities, API error handlers
│   └── main.tsx      # Frontend Entry point
└── shared/           # Zod schemas & types shared across processes
```

## Interview Flow

1. **Hardware Setup** - Verify system diagnostics and network latency
2. **Lobby Check-in** - Final readiness check before session entry
3. **Live Interview** - Engage with the AI via video, audio, and code editor
4. **Analysis Generation** - AI processes the transcript and behavior metrics
5. **Review Report** - View competency radar, timeline, and key moments

## Contributors

Meet the engineers behind Owlyn:

| Contributor              | GitHub Profile                                     |
| :----------------------- | :------------------------------------------------- |
| **Mosimiloluwa Adebisi** | [@A-Simie](https://github.com/A-Simie)             |
| **Amina**                | [@akeem](https://github.com/Akeem1955) |
| **Rahmannugar**          | [@Rahmannugar](https://github.com/Rahmannugar)     |

## License

Proprietary. All rights reserved.

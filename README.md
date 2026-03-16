# Owlyn

Owlyn is a real-time multimodal agent ecosystem that redefines technical hiring and developer assistance. By orchestrating low-latency voice, vision-based proctoring, and native code execution through the Gemini Live API, Owlyn provides an immersive, high-fidelity environment for evaluating and empowering technical talent.

## Features

### 1. Live Multimodal Interviews
- **Gemini Live Integration** - Sub-second conversational responses for natural, real-time dialogue.
- **Unified Workspace** - Integrated **Monaco Editor** (20+ languages), canvas-based **Whiteboard**, and **Notes** app.
- **Hardware Diagnostics** - Comprehensive pre-interview checks for camera, microphone, and network health.

### 2. The Sentinel Ecosystem (Proctoring)
- **Integrity Sentinel** - Real-time vision-based monitoring to detect unauthorized devices or participants.
- **Workspace Sentinel** - Analyzes implementation logic and code structure as it unfolds in the editor.
- **Lockdown Mode** - OS-level security via Electron to prevent navigation or unauthorized screen recording.

### 3. Assistant Mode
- **Multimodal Companion** - A floating desktop widget that sees your screen and hears your reasoning.
- **Ambient Debugging** - Context-aware assistance for architecting, debugging, and pair-programming in real-time.

### 4. Customization & Analytics
- **Persona Engine** - Configure behavioral scalars (Empathy, Analytical Depth, Directness) and linguistic localization.
- **Strategic Assessment** - Unbiased, data-driven reports with competency radar charts and full session transcripts.

## Tech Stack

### Desktop Layer
- **Electron 33** + **React 18** - Native hardware control and high-fidelity UI.
- **Framer Motion** - Smooth transitions and micro-animations.
- **Monaco Editor** - Professional-grade code editing engine.

### Orchestration Layer
- **Spring Boot 4** - Centralized session orchestration and agent routing.
- **LiveKit WebRTC** - Low-latency media backbone for synchronized audio/video feeds.
- **Redis** - Sub-millisecond state updates for active transcripts and session data.
- **PostgreSQL (Google Cloud SQL)** - Persistent storage for interview metrics and talent data.

### Intelligence Layer
- **Gemini Live API** - Powers the conversational interview loop.
- **Gemini 3.1 Pro/Flash** - Specialized agents for structural vision and strategic assessment.

## Getting Started

### Prerequisites
- Node.js 18+
- npm (for frontend)
- Java 17+ & Maven (for backend)

### Testing the Admin Flow
To test the recruitment dashboard and session monitoring features, use the following sandbox credentials:
- **Email**: `owlyn.admin@gmail.com`
- **Password**: [Any password of your choice]
- **OTP Code**: `123456`

### Installation

```bash
# 1. Clone the frontend
git clone https://github.com/A-Simie/Owlyn.git
cd Owlyn

# 2. Configure Environment Variables
# REQUIRED: Copy the example env and update the URLs for your local setup
cp .env.example .env

# 3. Install and Run Frontend
npm install
npm run dev

# 4. Clone and Run Backend
git clone https://github.com/Akeem1955/OwlynBackend.git
cd OwlynBackend
mvn spring-boot:run
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
| **Akeem Adetunji**       | [@akeem](https://github.com/Akeem1955)             |
| **Adenuga Abdulrahmon**  | [@Rahmannugar](https://github.com/Rahmannugar)     |

## License

Distributed under the MIT License. See `LICENSE` for more information.

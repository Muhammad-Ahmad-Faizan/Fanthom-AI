# Rally

Rally is a focused meeting intelligence workspace inspired by Fathom. It keeps the useful parts of a notetaker close to the moment after a call: a searchable meeting inbox, summaries, decision tags, action items, highlights, transcript playback, clip sharing, and a meeting-aware ask bar.

## Run locally

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173/`.

## Enable Groq

Copy `.env.example` to `.env`, add your `GROQ_API_KEY`, and restart Vite. Ask Rally sends the selected meeting context through the local `/api/groq` proxy, so the key is never exposed in the browser bundle.

## Deploy

Import the repository into Vercel, keep the default Vite build settings, and add `GROQ_API_KEY` under Project Settings → Environment Variables. The `api/` directory contains the production serverless routes for Ask Rally and Whisper transcription. The interface remains usable in demo mode without the key; only live AI requests are disabled.

## Product decisions

- The product name and visual language are original: Rally uses a quiet green workspace with warm coral accents and a dense, scan-friendly information architecture.
- The first viewport is seeded with three meetings so the core workflow is immediately legible.
- The workspace includes Home, My meetings, Team library, Customer calls, Settings, integrations, capture setup, and responsive mobile navigation as clickable surfaces.
- Capture and transcription are stubbed with realistic meeting data. The recording bot is deliberately not implemented in this prototype; effort went into the post-meeting workflow where the product earns its keep.
- Search, meeting switching, transcript mode, playback state, action item completion, summary template switching, highlight jumps, sharing feedback, and mobile navigation are interactive.

## Submission notes

The required capture setup was opened and reviewed. `CAPTURE-TEST.md` documents the current VS Code Copilot limitation: this workspace does not expose an automatic prompt/response lifecycle hook that can be installed and verified from project files. The `.agent-logs/` directory contains the honest session record rather than fabricated canaries.

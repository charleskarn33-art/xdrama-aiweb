# XDrama AI Studio — Roadmap

## Sprint 1 — Infrastructure Foundation (this PR)

- Next.js 16 + TypeScript + Tailwind v4 scaffold, dark cinematic theme
- Supabase browser/server clients + session-refresh middleware
- Email/password auth (sign up, sign in, sign out, protected dashboard)
- Core DB schema + RLS migration (profiles, projects, scripts, scenes,
  shots, characters, locations, props, storyboards, assets, ai_models,
  ai_workflows, ai_jobs, ai_job_events, render_jobs, exports, credit
  wallets/transactions/packages, notifications, user_settings, audit_logs)
- `AIComputeProvider` abstraction + `ModalComputeProvider`
- Model Registry (20 seeded models across video/image/audio/tts/lip_sync/llm)
- AI Router with capability-based selection, AUTO default, and fallback
- `ai/workflows/` template structure (7 categories, versioned metadata)
- `ai-server/` FastAPI orchestrator skeleton (honest 501s, no fake success)
- Navigation shell with all Section 53 nav items wired (stubs labeled by sprint)
- Vitest + pytest test setup

## Sprint 2 — MVP

- Script Studio: rich text editor, autosave, scene numbering, versioning, import/export
- Asset Library: upload, tag, search, signed URLs, thumbnails
- Project workspace layout (left nav / center workspace / right inspector / bottom timeline)
- Credit system UI: packages, purchase flow (billing provider TBD), balance display

## Sprint 3 — AI Filmmaking Engine

- Modal GPU functions implemented for at least one model per type (video/image/audio/tts/lip_sync)
- Real ComfyUI graphs wired into `ai/workflows/`
- AI Job system: QUEUED → ... → COMPLETED/FAILED lifecycle, Supabase Realtime progress updates
- Credit reservation/settlement around job execution
- Character Studio, Environment Studio, Storyboard Studio
- Model compatibility layer + fallback routing in production

## Sprint 4 — One-Click Movie Generation

- AI Script Analyzer → Story Bible
- AI Director + AI Cinematographer recommendations
- Prompt Engine (model-specific prompt/negative-prompt/parameter generation)
- Timeline Editor + Movie Composer + final render pipeline
- Voice Studio, Music Studio, Lip Sync, Subtitle Studio
- Shot-level resilience: retry a single failed shot, never the whole movie

## Sprint 5 — Commercial SaaS

- Billing architecture (packages, subscriptions, usage limits; pluggable provider)
- Admin dashboard (users, jobs, GPU usage, model usage, revenue, system health)
- Full observability (structured logs, cost tracking dashboards)
- Export Studio platform presets (YouTube/TikTok/Instagram/Facebook)
- Expanded language/cultural support (Liberian English, Kpelle, Bassa, Kru,
  Vai, Gio, Mano, Sierra Leonean and Guinean languages) as user-defined
  cultural context, not hard-coded assumptions
- Full test coverage across frontend/backend/DB/AI/infrastructure

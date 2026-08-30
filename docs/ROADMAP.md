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

Shipped:

- AI Job pipeline (`src/lib/ai/jobs.ts`): routes a model, checks
  compatibility (`src/lib/ai/compatibility.ts`), reserves XCredits via
  atomic Postgres RPCs (`reserve_credits`/`settle_job_credits`/
  `refund_reserved_credits`), creates the `ai_jobs` row, and submits to the
  `AIComputeProvider` — failing honestly (and refunding the reservation) if
  the provider is unreachable, never a fake success
- Supabase Realtime wired for `ai_jobs`/`ai_job_events`; `JobStatus` shows
  live stage/progress/error without a page refresh
- A project-scoped **Generate** panel exercises the full pipeline end to
  end — it fails with "AI provider unavailable" today because nothing
  downstream is deployed yet, which is the correct, honest behavior
- Character Studio and Environment Studio: full CRUD + reference image
  galleries (direct-to-storage upload, same pattern as the Asset Library)
- `ai-server/modal_app/`: a real, deployable Modal app with one function
  per generation type (video/image/audio/voice/lip_sync/movie render), GPU
  class pulled from the model registry — each currently raises
  `NotImplementedError` rather than fabricating a result

Deferred (needs real GPU infra, not just more app code):

- Wiring the orchestrator's `/jobs/submit` to actually call the Modal
  functions above (currently still `501` — nothing to call yet)
- Real ComfyUI graphs in `ai/workflows/` and at least one working model
  end to end (needs downloaded checkpoints + a ComfyUI image on a Modal volume)
- Storyboard Studio, Render Queue

## Sprint 4 — One-Click Movie Generation

Shipped:

- Scenes/Shots CRUD: create/edit/delete scenes (heading, INT/EXT, time of
  day, linked location, mood, description, estimated duration) with an
  inline shot list per scene (camera angle/movement, prompt, duration)
- Timeline data model (`timelines` table, one JSONB `tracks` blob per
  project) + a read/append/reorder/remove UI across the 8 spec track types
  (video/audio/voice/music/sfx/subtitles/transitions/overlays). "Add to
  Timeline" on a shot pushes it onto the video track. Drag-to-reposition,
  trim, and split are not built yet — reordering is arrow-button based for
  now; the data model doesn't need to change when that lands.
- Script Analyzer (`src/lib/script/analyze.ts`): deterministic screenplay
  parsing — no LLM call — that reads scene headings into Scenes+Locations
  and ALL-CAPS dialogue cues into Characters. "Analyze Script" in Script
  Studio seeds the Story Bible from a script and is safe to re-run (skips
  anything already imported by heading/name). The Story Bible itself is
  just the Characters/Locations/Scenes tables already built — no separate
  aggregation view yet. Mood, camera, and lighting suggestions need a real
  LLM call and are deferred with the rest of the AI Director work below.
- Prompt Engine (`src/lib/ai/prompt-engine.ts`): composes scene/location/
  mood/camera/character context into a model-ready prompt + a sensible
  default negative prompt, model-type aware (camera movement only applies
  to video). Deterministic string composition, no model call. Wired into
  the shot creation form's "Suggest" button.

Still open:

- AI Director + AI Cinematographer recommendations (needs a live LLM —
  same "no fake AI results" constraint as Sprint 3's Generate panel)
- Movie Composer + final render pipeline (reads `timelines.tracks` into
  `render_jobs.timeline_snapshot` — same shape, so no translation needed)
- Voice Studio, Music Studio, Lip Sync, Subtitle Studio
- Shot-level resilience: retry a single failed shot, never the whole movie
- Real drag/trim/split interactions on the Timeline (current version is
  click-to-reorder only)

## Sprint 5 — Commercial SaaS

- Billing architecture (packages, subscriptions, usage limits; pluggable provider)
- Admin dashboard (users, jobs, GPU usage, model usage, revenue, system health)
- Full observability (structured logs, cost tracking dashboards)
- Export Studio platform presets (YouTube/TikTok/Instagram/Facebook)
- Expanded language/cultural support (Liberian English, Kpelle, Bassa, Kru,
  Vai, Gio, Mano, Sierra Leonean and Guinean languages) as user-defined
  cultural context, not hard-coded assumptions
- Full test coverage across frontend/backend/DB/AI/infrastructure

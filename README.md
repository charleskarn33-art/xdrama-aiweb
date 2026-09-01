# XDrama AI Studio

Script → complete movie. A professional AI filmmaking platform: users write
or upload a script and get scenes, characters, storyboards, voice, music,
and a final cut — without ever touching ComfyUI, GPU infra, or model
configuration directly.

## Architecture

```
USER → Next.js (Vercel) → Supabase (auth/db/storage/realtime/RLS)
                        → AIComputeProvider → Modal → ComfyUI → AI models
                        → Modal post-processing → Supabase Storage
                        → Timeline → Export → USER
```

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, deployed to Vercel.
- **Database/Auth/Storage/Realtime**: Supabase, with Row Level Security on every user-owned table.
- **GPU compute**: never called directly. The app depends on the `AIComputeProvider`
  interface (`src/lib/ai/provider.ts`); `ModalComputeProvider` is the only
  implementation today. Future providers (RunPod, AWS, Lambda, Vast.ai, a
  dedicated GPU server) implement the same interface without touching call sites.
- **AI orchestrator** (`ai-server/`): a separate FastAPI service that is the
  only thing allowed to talk to Modal/ComfyUI. It is never exposed publicly.
- **Model Registry** (`src/lib/ai/model-registry.ts`, mirrored in the
  `ai_models` table): every model declares its own capabilities, VRAM
  requirements, resolutions, and status. The **AI Router**
  (`src/lib/ai/router.ts`) only ever routes to a model that declares the
  capability a task needs — it never assumes support.
- **Workflows** (`ai/workflows/`): ComfyUI workflow templates, versioned and
  stored separately from application code.

## Repository layout

```
src/app/              Next.js routes (marketing, auth, dashboard)
src/lib/supabase/     Browser/server Supabase clients + session middleware
src/lib/ai/           AIComputeProvider, ModalComputeProvider, model registry, AI Router
src/types/            Database + model registry types
ai/workflows/         ComfyUI workflow templates (metadata + graphs)
ai-server/            FastAPI orchestrator that talks to Modal/ComfyUI
supabase/migrations/  SQL schema + RLS policies + model registry seed
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase + orchestrator values
npm run dev
```

Database: point the Supabase CLI at this project and run
`supabase db push` (or apply `supabase/migrations/*.sql` directly) against
your Supabase project before signing up — the schema includes a trigger
that provisions a `profiles` row and `credit_wallets` row on signup.

AI orchestrator (optional locally — the app degrades gracefully to
"AI provider unavailable" without it):

```bash
cd ai-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn services.orchestrator:app --reload --port 8787
```

## Testing

```bash
npm run lint
npm test          # vitest — model registry + AI router unit tests
cd ai-server && pytest   # orchestrator contract tests
```

## Roadmap

Built in phases — see `docs/ROADMAP.md` for the full sprint breakdown.
Sprint 1 (this state) ships infrastructure only: auth, project CRUD, the
model registry/router/compute-provider abstraction, DB schema with RLS, and
a navigation shell with honest "coming soon" stubs for modules that ship in
later sprints. No AI generation is wired up yet — the orchestrator responds
`501` rather than faking a result.

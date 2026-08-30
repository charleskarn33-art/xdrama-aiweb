# XDrama AI Orchestrator (ai-server/)

This is the only service that talks to Modal and ComfyUI. The Next.js app
never calls Modal directly — it calls this orchestrator through
`AIComputeProvider` (see `src/lib/ai/providers/modal.ts`), which is
configured with `AI_ORCHESTRATOR_URL`.

```
ai-server/
  modal/        Modal app + GPU function definitions (video_generation,
                image_generation, audio_generation, tts_generation,
                lip_sync, video_processing, movie_rendering)
  models/       Model loading/caching logic per registered model
  workflows/    ComfyUI workflow execution helpers (reads ai/workflows/)
  services/     FastAPI orchestrator — the HTTP surface this app calls
  routers/      FastAPI route modules (jobs, health)
  workers/      Background workers (job polling, cost settlement)
  processing/   Post-processing (transcode, thumbnail, upscale)
  storage/      Upload results to Supabase Storage
  tests/        Modal function tests, workflow tests, job lifecycle tests
```

## Status

Sprint 1 ships the service skeleton and the HTTP contract only — the GPU
functions are not implemented yet (Sprint 3: AI Filmmaking Engine). Every
endpoint below responds honestly with `501 Not Implemented` rather than a
fake success, per the "no fake AI results" rule in the architecture spec.

## Endpoints (`services/orchestrator.py`)

- `POST /jobs/submit` — submit a generation job to Modal/ComfyUI
- `POST /jobs/status` — poll a job's current status
- `POST /jobs/cancel` — cancel a running job

## Running locally

```bash
cd ai-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn services.orchestrator:app --reload --port 8787
```

Set `AI_ORCHESTRATOR_URL=http://127.0.0.1:8787` in the Next.js app's
`.env.local` to point at it locally. Modal deployment (`modal deploy`) is
configured once the GPU functions in `modal/` are implemented.

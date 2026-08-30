# XDrama AI Orchestrator (ai-server/)

This is the only service that talks to Modal and ComfyUI. The Next.js app
never calls Modal directly — it calls this orchestrator through
`AIComputeProvider` (see `src/lib/ai/providers/modal.ts`), which is
configured with `AI_ORCHESTRATOR_URL`.

```
ai-server/
  modal_app/    Modal app + GPU function definitions (generate_video,
                generate_image, generate_audio, generate_voice, lip_sync,
                render_movie). Named modal_app/, not modal/ — a directory
                literally named modal/ shadows the `modal` pip package for
                every `import modal` inside this tree.
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

The service skeleton and the HTTP contract are wired up, and `modal_app/`
has a real, deployable Modal app — one function per generation type
(`generate_video`, `generate_image`, `generate_audio`, `generate_voice`,
`lip_sync`, `render_movie`), each with a GPU class pulled from the model
registry. None of them run real inference yet: every function raises
`NotImplementedError` rather than a fake success, per the "no fake AI
results" rule in the architecture spec. Wiring one up for real means
downloading that model's checkpoint onto a Modal volume and building a
ComfyUI image for it — real infrastructure this scaffold doesn't have
provisioned. The orchestrator endpoints below still respond `501` because
they don't call these functions yet (that dispatch wiring is the next
slice once at least one model is really running).

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

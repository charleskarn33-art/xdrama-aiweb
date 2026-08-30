"""XDrama Modal app — GPU function definitions (architecture spec section 11).

Each generation type gets its own Modal function so GPU class, image, and
scaling can be tuned per workload. The `services/orchestrator.py` FastAPI
service is the only caller — the Next.js app never imports this module or
holds Modal credentials.

Every function here raises NotImplementedError. That's deliberate, not an
oversight: wiring real inference means downloading specific model
checkpoints onto a Modal volume and building a ComfyUI image per model,
which needs a live Modal account/GPU quota this repo does not have while
scaffolding. Deploying this file today is safe — every call fails loudly
instead of returning a fake result (see "no fake AI results" in the
architecture spec). Implementing one function at a time, per model, is the
next slice of work once real infrastructure is available.
"""

from __future__ import annotations

import modal

app = modal.App("xdrama-ai-studio")

base_image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "httpx",
    "pydantic",
)


def _not_implemented(model_id: str, job_type: str) -> None:
    raise NotImplementedError(
        f"{job_type} generation for model '{model_id}' is not implemented yet. "
        "This Modal function is a real, deployable skeleton — the GPU/ComfyUI "
        "wiring for this model ships once its weights and workflow graph are "
        "in place."
    )


# GPU class per model, pulled from the model registry's minimum/recommended
# VRAM (src/lib/ai/model-registry.ts) — never hard-coded to a single GPU
# (architecture spec section 11).
MODEL_GPU: dict[str, str] = {
    "wan-2.2": "L40S",
    "skyreels-v2": "L40S",
    "hunyuan-video": "A100",
    "cogvideox": "A10G",
    "open-sora": "L40S",
    "ltx-video": "L4",
    "stable-video-diffusion": "A10G",
    "flux": "A10G",
    "sdxl": "L4",
    "musicgen": "L4",
    "audiocraft": "L4",
    "stable-audio-open": "L4",
    "kokoro": "L4",
    "piper": "L4",
    "coqui-tts": "L4",
    "musetalk": "A10G",
    "latentsync": "A10G",
    "qwen": "A100",
    "llama": "A100",
    "deepseek": "A100",
}


@app.function(image=base_image, gpu="L40S", timeout=600)
def generate_video(job_id: str, model_id: str, workflow_id: str, input: dict) -> dict:
    _not_implemented(model_id, "video")


@app.function(image=base_image, gpu="A10G", timeout=300)
def generate_image(job_id: str, model_id: str, workflow_id: str, input: dict) -> dict:
    _not_implemented(model_id, "image")


@app.function(image=base_image, gpu="L4", timeout=300)
def generate_audio(job_id: str, model_id: str, workflow_id: str, input: dict) -> dict:
    _not_implemented(model_id, "audio")


@app.function(image=base_image, gpu="L4", timeout=180)
def generate_voice(job_id: str, model_id: str, workflow_id: str, input: dict) -> dict:
    _not_implemented(model_id, "voice/TTS")


@app.function(image=base_image, gpu="A10G", timeout=300)
def lip_sync(job_id: str, model_id: str, workflow_id: str, input: dict) -> dict:
    _not_implemented(model_id, "lip sync")


@app.function(image=base_image, cpu=4.0, timeout=1800)
def render_movie(job_id: str, project_id: str, timeline_snapshot: dict) -> dict:
    raise NotImplementedError(
        "Movie rendering/composition is not implemented yet — it depends on "
        "the Timeline Editor and Movie Composer (Sprint 4)."
    )

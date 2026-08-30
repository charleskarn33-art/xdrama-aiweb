"""XDrama AI Orchestrator — HTTP surface between the Next.js app and Modal/ComfyUI.

This is the only service the application talks to for GPU work
(architecture spec sections 9, 46, 47, 66). It never exposes ComfyUI or
Modal credentials to callers.

Sprint 1 ships the contract only: every endpoint responds with 501 until
the Modal GPU functions in ../modal/ are implemented (Sprint 3). This is
intentional — see "Do not use fake AI results" in the architecture spec.
Returning a fake 200 here would violate that rule.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="XDrama AI Orchestrator")


class SubmitJobRequest(BaseModel):
    jobId: str
    jobType: str
    modelId: str
    workflowId: str
    userId: str
    projectId: str | None = None
    input: dict


class JobRefRequest(BaseModel):
    provider_job_id: str


NOT_IMPLEMENTED_DETAIL = (
    "AI provider unavailable: GPU generation is not implemented yet "
    "(ships in Sprint 3 — AI Filmmaking Engine)."
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "gpu_functions_implemented": False}


@app.post("/jobs/submit")
def submit_job(request: SubmitJobRequest) -> dict:
    raise HTTPException(status_code=501, detail=NOT_IMPLEMENTED_DETAIL)


@app.post("/jobs/status")
def job_status(request: JobRefRequest) -> dict:
    raise HTTPException(status_code=501, detail=NOT_IMPLEMENTED_DETAIL)


@app.post("/jobs/cancel")
def cancel_job(request: JobRefRequest) -> dict:
    raise HTTPException(status_code=501, detail=NOT_IMPLEMENTED_DETAIL)

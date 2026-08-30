"""Job-lifecycle contract tests for the orchestrator skeleton.

These pin down the Sprint 1 promise: every job endpoint must fail loudly
(501) instead of returning a fake success while GPU functions are
unimplemented. When Sprint 3 wires up real Modal functions, these tests
should be replaced with real submit/poll/cancel assertions.
"""

from fastapi.testclient import TestClient

from services.orchestrator import app

client = TestClient(app)


def test_health_reports_gpu_not_implemented():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "gpu_functions_implemented": False}


def test_submit_job_is_honestly_not_implemented():
    response = client.post(
        "/jobs/submit",
        json={
            "jobId": "00000000-0000-0000-0000-000000000000",
            "jobType": "text_to_video",
            "modelId": "wan-2.2",
            "workflowId": "text-to-video.cinematic-v1",
            "userId": "00000000-0000-0000-0000-000000000001",
            "input": {"prompt": "a quiet village at dawn"},
        },
    )
    assert response.status_code == 501


def test_job_status_is_honestly_not_implemented():
    response = client.post("/jobs/status", json={"provider_job_id": "abc"})
    assert response.status_code == 501


def test_cancel_job_is_honestly_not_implemented():
    response = client.post("/jobs/cancel", json={"provider_job_id": "abc"})
    assert response.status_code == 501

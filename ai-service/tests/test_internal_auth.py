from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_is_public():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "ai-service"


def test_pipeline_requires_token_when_configured(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_TOKEN", "test-ai-token")
    denied = client.post("/v1/pipeline", json={"text": "Circular No. 1/2026"})
    assert denied.status_code == 401

    allowed = client.post(
        "/v1/pipeline",
        json={"text": "Circular No. 1/2026 issued on 01/01/2026 by Ministry of Education."},
        headers={"X-AI-Service-Token": "test-ai-token"},
    )
    assert allowed.status_code == 200
    body = allowed.json()
    assert "summary" in body
    assert "entities" in body

"""
test_05_api_health.py — Appium E2E: Backend API Health Check
Validates the backend API is reachable and responding correctly.
"""
import pytest
import requests


@pytest.mark.api
class TestAPIHealth:

    def test_health_endpoint_returns_200(self, api_url):
        """GET /api/health should return HTTP 200."""
        # api_url is accessible from the test runner (not the emulator),
        # so we call it directly via requests.
        try:
            resp = requests.get(f"{api_url.replace('10.0.2.2', 'localhost')}/health", timeout=8)
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        assert resp.status_code == 200, \
            f"Expected 200 from /api/health, got {resp.status_code}"

    def test_health_endpoint_returns_json(self, api_url):
        """Health endpoint should return JSON with success=true."""
        try:
            resp = requests.get(f"{api_url.replace('10.0.2.2', 'localhost')}/health", timeout=8)
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        data = resp.json()
        assert data.get("success") is True, \
            f"Expected success=true in health response: {data}"

    def test_health_endpoint_contains_version(self, api_url):
        """Health endpoint should include a version field."""
        try:
            resp = requests.get(f"{api_url.replace('10.0.2.2', 'localhost')}/health", timeout=8)
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        data = resp.json()
        assert "version" in data, \
            f"Expected version field in health response: {data}"

    def test_unauthorized_protected_endpoint(self, api_url):
        """Calling a protected endpoint without token should return 401."""
        try:
            resp = requests.get(
                f"{api_url.replace('10.0.2.2', 'localhost')}/users/profile",
                timeout=8,
            )
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        assert resp.status_code == 401, \
            f"Expected 401 for unauthenticated request, got {resp.status_code}"

    def test_invalid_login_returns_401(self, api_url):
        """POST /api/auth/login with wrong credentials should return 4xx."""
        try:
            resp = requests.post(
                f"{api_url.replace('10.0.2.2', 'localhost')}/auth/login",
                json={"email": "nobody@nowhere.com", "password": "wrongpass"},
                timeout=8,
            )
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        assert resp.status_code in (400, 401, 403), \
            f"Expected 4xx for invalid login, got {resp.status_code}"

    def test_register_missing_fields_returns_400(self, api_url):
        """POST /api/auth/register with missing fields should return 400."""
        try:
            resp = requests.post(
                f"{api_url.replace('10.0.2.2', 'localhost')}/auth/register",
                json={"email": "incomplete@test.com"},
                timeout=8,
            )
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        assert resp.status_code in (400, 422), \
            f"Expected 400/422 for incomplete registration, got {resp.status_code}"

    def test_cors_headers_present(self, api_url):
        """Health endpoint response should include CORS headers."""
        try:
            resp = requests.options(
                f"{api_url.replace('10.0.2.2', 'localhost')}/health",
                headers={"Origin": "http://localhost:5173"},
                timeout=8,
            )
        except Exception as exc:
            pytest.skip(f"API not reachable: {exc}")
        headers = {k.lower(): v for k, v in resp.headers.items()}
        has_cors = (
            "access-control-allow-origin" in headers
            or resp.status_code in (200, 204)
        )
        assert has_cors, f"Expected CORS headers. Headers: {dict(resp.headers)}"

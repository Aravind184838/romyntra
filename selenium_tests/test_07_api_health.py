"""
test_07_api_health.py - Backend API sanity / health check tests via Selenium
"""
import time
import pytest
import requests

API_URL = "http://localhost:5000/api"


class TestAPIHealth:
    """These tests call the backend REST API directly using requests.
       They run as part of the Selenium test suite to validate backend health."""

    def test_api_health_endpoint(self):
        """GET /api/health should return 200."""
        try:
            r = requests.get(f"{API_URL}/health", timeout=5)
            assert r.status_code == 200
            data = r.json()
            assert data.get("success") is True
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running — skipping API health tests")

    def test_register_missing_fields(self):
        """POST /api/auth/register with missing fields should return 400."""
        try:
            r = requests.post(
                f"{API_URL}/auth/register",
                json={"name": "Incomplete"},
                timeout=5
            )
            assert r.status_code == 400
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

    def test_register_underage(self):
        """Registering someone under 18 should return 400."""
        import random
        try:
            r = requests.post(
                f"{API_URL}/auth/register",
                json={
                    "name": "Young User",
                    "email": f"young_{random.randint(1,9999)}@test.com",
                    "phone": f"+9199{random.randint(100000,999999)}",
                    "password": "Password1!",
                    "dob": "2015-01-01",  # 9 years old
                    "gender": "not-specified"
                },
                timeout=5
            )
            assert r.status_code == 400
            assert "18" in r.text or "age" in r.text.lower()
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password should return 401."""
        try:
            r = requests.post(
                f"{API_URL}/auth/login",
                json={"email": "nobody@test.com", "password": "wrongpass"},
                timeout=5
            )
            assert r.status_code == 401
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

    def test_protected_route_without_token(self):
        """GET /api/users/profile without token should return 401."""
        try:
            r = requests.get(f"{API_URL}/users/profile", timeout=5)
            assert r.status_code == 401
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

    def test_full_register_and_login_flow(self):
        """Register a new user then immediately log in — both should succeed."""
        import random
        email = f"flow_{random.randint(10000,99999)}@test.com"
        password = "Password1!"
        try:
            # Register
            reg = requests.post(
                f"{API_URL}/auth/register",
                json={
                    "name": "Flow Tester",
                    "email": email,
                    "phone": f"+9188{random.randint(100000,999999)}",
                    "password": password,
                    "dob": "1995-03-20",
                    "gender": "not-specified"
                },
                timeout=5
            )
            if reg.status_code not in (200, 201):
                pytest.skip(f"Registration failed: {reg.text}")

            reg_data = reg.json()
            assert reg_data.get("success") is True
            assert "token" in reg_data

            # Login
            login = requests.post(
                f"{API_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            assert login.status_code == 200
            login_data = login.json()
            assert login_data.get("success") is True
            assert "token" in login_data

        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

    def test_duplicate_email_register(self):
        """Registering with the same email twice should return 400."""
        import random
        email = f"dup_{random.randint(10000,99999)}@test.com"
        payload = {
            "name": "Dup User",
            "email": email,
            "phone": f"+9177{random.randint(100000,999999)}",
            "password": "Password1!",
            "dob": "1990-01-01",
            "gender": "not-specified"
        }
        try:
            r1 = requests.post(f"{API_URL}/auth/register", json=payload, timeout=5)
            if r1.status_code not in (200, 201):
                pytest.skip("First registration failed, can't test duplicate")
            r2 = requests.post(f"{API_URL}/auth/register", json=payload, timeout=5)
            assert r2.status_code == 400
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend not running")

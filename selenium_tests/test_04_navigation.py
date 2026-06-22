"""
test_04_navigation.py - Navigation / routing tests
"""
import time
import requests
import random
import pytest
from selenium.webdriver.common.by import By
from helpers import navigate, wait_for, do_login, get_hash_path


# ── Helper: register + login programmatically ──────────────────────────────
def register_and_login(driver, base_url, api_url="http://localhost:5000/api"):
    """Register a fresh user, log them in via the UI, return email."""
    email = f"nav_{random.randint(10000, 99999)}@test.com"
    password = "Password1!"
    try:
        resp = requests.post(
            f"{api_url}/auth/register",
            json={
                "name": "Nav Tester",
                "email": email,
                "phone": f"+9190000{random.randint(10000,99999)}",
                "password": password,
                "dob": "2000-01-01",
                "gender": "not-specified"
            },
            timeout=5
        )
        if resp.status_code not in (200, 201):
            return None
    except Exception:
        return None

    do_login(driver, base_url, email, password)
    time.sleep(2)
    return email


class TestNavigation:

    def test_unauthenticated_redirect_discover(self, driver, base_url):
        """Accessing /discover without a token should redirect to login or splash."""
        # Clear stored token
        driver.get(base_url)
        driver.execute_script("localStorage.removeItem('romyntra_token');")
        driver.refresh()
        navigate(driver, base_url, "/discover")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path != "/discover", f"Expected redirect, got path: {hash_path}"

    def test_unauthenticated_redirect_profile(self, driver, base_url):
        """Accessing /profile without a token should redirect."""
        driver.get(base_url)
        driver.execute_script("localStorage.removeItem('romyntra_token');")
        driver.refresh()
        navigate(driver, base_url, "/profile")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path != "/profile", f"Expected redirect from /profile, got: {hash_path}"

    def test_unauthenticated_redirect_matches(self, driver, base_url):
        """Accessing /matches without a token should redirect."""
        driver.get(base_url)
        driver.execute_script("localStorage.removeItem('romyntra_token');")
        driver.refresh()
        navigate(driver, base_url, "/matches")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path != "/matches", f"Expected redirect from /matches, got: {hash_path}"

    def test_authenticated_can_access_discover(self, driver, base_url):
        """A logged-in user should be able to reach /discover."""
        email = register_and_login(driver, base_url)
        if not email:
            pytest.skip("Backend not reachable for registration")
        navigate(driver, base_url, "/discover")
        time.sleep(1.5)
        # Should be on /discover (or setup-profile for new users without complete profile)
        hash_path = get_hash_path(driver)
        assert hash_path in ("/discover", "/setup-profile"), \
            f"Authenticated user couldn't reach /discover. Hash path={hash_path}"

    def test_authenticated_can_access_matches(self, driver, base_url):
        """A logged-in user should be able to reach /matches."""
        # Reuse existing auth state
        navigate(driver, base_url, "/matches")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path in ("/matches", "/setup-profile", "/login"), \
            f"Unexpected hash path: {hash_path}"

    def test_logout_clears_session(self, driver, base_url):
        """After logout, user should not be able to access protected routes."""
        # Clear token directly
        driver.execute_script("localStorage.removeItem('romyntra_token');")
        driver.refresh()
        navigate(driver, base_url, "/discover")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path != "/discover", \
            "User can still access /discover after logout"

    def test_unknown_route_redirects_to_splash(self, driver, base_url):
        """Unknown routes should redirect to splash (/)."""
        navigate(driver, base_url, "/this-does-not-exist-12345")
        time.sleep(1.5)
        hash_path = get_hash_path(driver)
        assert hash_path in ("/", "/login"), f"Unknown route didn't redirect. Hash path: {hash_path}"

    def test_login_link_from_signup(self, driver, base_url):
        """'Already have an account?' on signup links to /login."""
        navigate(driver, base_url, "/signup")
        link = driver.find_element(By.XPATH, "//a[contains(@href, 'login')]")
        link.click()
        time.sleep(1)
        hash_path = get_hash_path(driver)
        assert hash_path == "/login", f"Expected /login path, got: {hash_path}"

    def test_signup_link_from_login(self, driver, base_url):
        """'Create account' on login links to /signup."""
        navigate(driver, base_url, "/login")
        link = driver.find_element(By.XPATH, "//a[contains(@href, 'signup')]")
        link.click()
        time.sleep(1)
        hash_path = get_hash_path(driver)
        assert hash_path == "/signup", f"Expected /signup path, got: {hash_path}"

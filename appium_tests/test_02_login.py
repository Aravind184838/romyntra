"""
test_02_login.py — Appium E2E: Login Page
Tests the Romyntra login form on Android Chrome.
"""
import time
import random
import pytest
import requests
from pages.login_page import LoginPage


@pytest.mark.auth
class TestLoginPage:

    def test_login_page_loads(self, driver, base_url):
        """Login page renders with email/phone toggle."""
        page = LoginPage(driver, base_url).open()
        page.screenshot("login_loaded")
        assert page.is_loaded(), "Login page did not load — email input not visible"
        assert "/login" in page.current_url

    def test_email_tab_is_default(self, driver, base_url):
        """Email tab should be active by default."""
        page = LoginPage(driver, base_url).open()
        assert page.is_email_input_visible(), \
            "Email input should be visible by default"

    def test_phone_tab_toggle(self, driver, base_url):
        """Switching to Phone tab should reveal phone input."""
        page = LoginPage(driver, base_url).open()
        page.switch_to_phone_tab()
        page.screenshot("login_phone_tab")
        assert page.is_phone_input_visible(), \
            "Phone input not visible after switching to Phone tab"

    def test_email_tab_switch_back(self, driver, base_url):
        """Switching back to Email tab should restore email input."""
        page = LoginPage(driver, base_url).open()
        page.switch_to_phone_tab()
        page.switch_to_email_tab()
        page.screenshot("login_email_tab_restored")
        assert page.is_email_input_visible(), \
            "Email input not visible after switching back from Phone tab"

    def test_empty_submit_shows_validation(self, driver, base_url):
        """Submitting empty form should show validation errors."""
        page = LoginPage(driver, base_url).open()
        page.submit()
        page.screenshot("login_empty_validation")
        src = page.get_validation_error()
        assert "required" in src or "email" in src or "/login" in page.current_url, \
            "Expected validation error on empty submit"

    def test_invalid_credentials_shows_error(self, driver, base_url):
        """Wrong credentials should remain on /login and show error."""
        page = LoginPage(driver, base_url)
        page.login("wrong@nobody.com", "BadPass123!")
        page.screenshot("login_invalid_creds")
        src  = page.get_validation_error()
        url  = page.current_url
        assert "/login" in url or "invalid" in src or "error" in src or "incorrect" in src, \
            f"Expected error on invalid credentials. URL: {url}"

    def test_password_toggle_hides_shows_text(self, driver, base_url):
        """Eye icon should toggle password visibility between 'password' and 'text'."""
        page = LoginPage(driver, base_url).open()
        page.enter_email("test@test.com")
        page.enter_password("SomePassword")
        pw_type_before = page.get_password_input_type()
        page.toggle_password_visibility()
        pw_type_after = page.get_password_input_type()
        page.screenshot("login_password_toggle")
        assert pw_type_before == "password", "Password should be hidden by default"
        assert pw_type_after  == "text",     "Password should be visible after toggle"

    def test_signup_link_navigates_to_signup(self, driver, base_url):
        """'Create account' link should navigate to /signup."""
        page = LoginPage(driver, base_url).open()
        page.click_signup_link()
        page.screenshot("login_to_signup_link")
        assert "/signup" in page.current_url, \
            f"Expected /signup, got: {page.current_url}"

    def test_valid_credentials_redirect_away_from_login(self, driver, base_url, api_url):
        """Valid login should redirect away from /login."""
        # Register a fresh user via the API first
        email    = f"appium_{random.randint(1000, 9999)}@test.com"
        password = "Password1!"
        try:
            resp = requests.post(
                f"{api_url}/auth/register",
                json={
                    "name":     "Appium Login",
                    "email":    email,
                    "phone":    f"+9198{random.randint(10000000, 99999999)}",
                    "password": password,
                    "dob":      "2000-01-01",
                    "gender":   "not-specified",
                },
                timeout=8,
            )
            if resp.status_code not in (200, 201):
                pytest.skip(f"Could not register user via API: {resp.text[:200]}")
        except Exception as exc:
            pytest.skip(f"API not reachable from test runner: {exc}")

        page = LoginPage(driver, base_url)
        page.login(email, password)
        time.sleep(2)
        page.screenshot("login_valid_redirect")
        assert page.is_redirected_away_from_login(), \
            f"Expected redirect after valid login. URL: {page.current_url}"

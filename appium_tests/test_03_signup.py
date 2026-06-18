"""
test_03_signup.py — Appium E2E: Signup Page (3-step form)
Tests the Romyntra registration flow on Android Chrome.
"""
import time
import pytest
from pages.signup_page import SignupPage

BASE_TS = int(time.time())


@pytest.mark.auth
class TestSignupPage:

    def test_signup_page_loads(self, driver, base_url):
        """Signup page renders with name field visible."""
        page = SignupPage(driver, base_url).open()
        page.screenshot("signup_loaded")
        assert page.is_loaded(), "Signup page did not load — name input not visible"
        assert "/signup" in page.current_url

    def test_step1_fields_visible(self, driver, base_url):
        """Step 1 should show name, email, and password fields."""
        page = SignupPage(driver, base_url).open()
        assert page.is_step1_visible(), "Step 1 name field not visible"

    def test_step1_empty_shows_validation(self, driver, base_url):
        """Clicking Next with empty Step 1 should show validation errors."""
        page = SignupPage(driver, base_url).open()
        page.next_step()
        page.screenshot("signup_step1_empty_validation")
        src = page.get_validation_text()
        assert "required" in src or "name" in src, \
            "Expected validation error on empty Step 1 submit"

    def test_step1_password_mismatch_blocked(self, driver, base_url):
        """Mismatched passwords should block advancing to Step 2."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1(
            name="Test",
            email=f"mismatch_{BASE_TS}@test.com",
            password="Password1!",
            confirm="DifferentPassword!"
        )
        page.next_step()
        page.screenshot("signup_password_mismatch")
        src = page.get_validation_text()
        assert "match" in src or page.is_step1_visible(), \
            "Expected password mismatch error"

    def test_step1_valid_advances_to_step2(self, driver, base_url):
        """Valid Step 1 data should reveal Step 2 (phone/dob)."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1("Valid User", f"valid_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        page.screenshot("signup_step2_visible")
        assert page.is_step2_visible(), \
            "Step 2 phone/dob not visible after valid Step 1"

    def test_step2_empty_shows_validation(self, driver, base_url):
        """Empty Step 2 submit should show validation errors."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1("Val2", f"v2_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        page.next_step()   # submit empty step 2
        page.screenshot("signup_step2_empty_validation")
        src = page.get_validation_text()
        assert "required" in src or "phone" in src or page.is_step2_visible(), \
            "Expected phone required error"

    def test_step2_valid_advances_to_step3(self, driver, base_url):
        """Valid Step 2 data should reveal Step 3 (terms)."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1("Val3", f"v3_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        page.fill_step2("+919876543210", "2000-06-15")
        page.next_step()
        page.screenshot("signup_step3_visible")
        assert page.is_step3_visible(), \
            "Step 3 terms checkbox not visible after valid Step 2"

    def test_step3_submit_without_terms_shows_error(self, driver, base_url):
        """Submitting Step 3 without accepting terms should show error."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1("Val4", f"v4_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        page.fill_step2("+919876543211", "2000-06-15")
        page.next_step()
        # Click submit WITHOUT accepting terms
        from selenium.webdriver.common.by import By
        page.click(By.ID, "signup-submit")
        time.sleep(0.6)
        page.screenshot("signup_no_terms_error")
        src = page.get_validation_text()
        assert "terms" in src or "accept" in src or page.is_step3_visible(), \
            "Expected terms acceptance required error"

    def test_back_button_returns_to_step1(self, driver, base_url):
        """Back button from Step 2 should return to Step 1."""
        page = SignupPage(driver, base_url).open()
        page.fill_step1("Nav", f"nav_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        assert page.is_step2_visible(), "Should be on Step 2"
        page.back_step()
        page.screenshot("signup_back_to_step1")
        assert page.is_step1_visible(), \
            "Back button did not return to Step 1"

    def test_step_indicator_updates(self, driver, base_url):
        """Step indicator should reflect current step number."""
        page = SignupPage(driver, base_url).open()
        assert page.is_on_step(1), "Should start on Step 1"
        page.fill_step1("Ind", f"ind_{BASE_TS}@test.com", "Password1!")
        page.next_step()
        assert page.is_on_step(2), "Step indicator should show Step 2"
        page.fill_step2("+919876543212", "2000-06-15")
        page.next_step()
        assert page.is_on_step(3), "Step indicator should show Step 3"

    def test_full_signup_triggers_backend_response(self, driver, base_url):
        """Completing all 3 steps should trigger a backend response (OTP/redirect/error)."""
        page = SignupPage(driver, base_url)
        unique = int(time.time())
        page.complete_signup(
            name=f"Full Appium {unique}",
            email=f"full_{unique}@test.com",
            password="Password1!",
            phone=f"+9199{unique % 100000000:08d}",
            dob="2000-01-15",
        )
        page.screenshot("signup_full_submission_result")
        url = page.current_url
        src = page.get_validation_text()
        assert (
            "/verify-otp"    in url
            or "/setup-profile" in url
            or "otp"            in src
            or "sms"            in src
            or "error"          in src
            or "account"        in src
        ), f"Expected post-signup state. URL: {url}"

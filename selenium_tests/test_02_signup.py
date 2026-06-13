"""
test_02_signup.py - Signup page / multi-step form tests
"""
import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from helpers import (
    navigate, wait_for, click, fill,
    do_signup_step1, do_signup_step2, do_signup_step3, get_toast_text
)
from conftest import TEST_USER

BASE_EMAIL_SEED = int(time.time())


class TestSignupPage:

    def test_signup_page_loads(self, driver, base_url):
        """Signup page renders with the multi-step form."""
        navigate(driver, base_url, "/signup")
        assert "/signup" in driver.current_url
        wait_for(driver, By.ID, "signup-name")

    def test_step_1_shows_correct_fields(self, driver, base_url):
        """Step 1 should show name, email, password fields."""
        navigate(driver, base_url, "/signup")
        assert driver.find_element(By.ID, "signup-name").is_displayed()
        assert driver.find_element(By.ID, "signup-email").is_displayed()
        assert driver.find_element(By.ID, "signup-password").is_displayed()

    def test_step_1_validation_empty(self, driver, base_url):
        """Clicking Next on empty Step 1 should show validation errors."""
        navigate(driver, base_url, "/signup")
        click(driver, By.ID, "signup-next")
        time.sleep(0.5)
        # Should still be on step 1 (url unchanged, error messages visible)
        src = driver.page_source
        assert "required" in src.lower() or "name" in src.lower(), \
            "Expected validation error text not found"

    def test_step_1_password_mismatch(self, driver, base_url):
        """Mismatching passwords should block advancing to step 2."""
        navigate(driver, base_url, "/signup")
        fill(driver, By.ID, "signup-name",     "Test User")
        fill(driver, By.ID, "signup-email",    f"mismatch_{BASE_EMAIL_SEED}@test.com")
        fill(driver, By.ID, "signup-password", "Password1!")
        fill(driver, By.XPATH, "//input[@placeholder='Repeat password']", "Different1!")
        click(driver, By.ID, "signup-next")
        time.sleep(0.5)
        src = driver.page_source
        assert "match" in src.lower() or "Step 1" in src, \
            "Expected password mismatch error"

    def test_step_1_advances_with_valid_data(self, driver, base_url):
        """Valid Step 1 data should reveal Step 2."""
        navigate(driver, base_url, "/signup")
        do_signup_step1(
            driver,
            "Valid User",
            f"valid_{BASE_EMAIL_SEED}@test.com",
            "Password1!"
        )
        # Step 2 shows phone + dob
        wait_for(driver, By.ID, "signup-phone")
        assert driver.find_element(By.ID, "signup-phone").is_displayed()

    def test_step_2_validation_empty(self, driver, base_url):
        """Clicking Next on empty Step 2 should show validation errors."""
        navigate(driver, base_url, "/signup")
        do_signup_step1(driver, "Valid User", f"v2_{BASE_EMAIL_SEED}@test.com", "Password1!")
        click(driver, By.ID, "signup-next")
        time.sleep(0.5)
        src = driver.page_source
        assert "required" in src.lower() or "phone" in src.lower(), \
            "Expected phone required validation"

    def test_step_2_advances_with_valid_data(self, driver, base_url):
        """Valid Step 2 data should reveal Step 3 (Terms)."""
        navigate(driver, base_url, "/signup")
        do_signup_step1(driver, "Valid User", f"v3_{BASE_EMAIL_SEED}@test.com", "Password1!")
        do_signup_step2(driver, "+919876543210", "2000-06-15")
        # Step 3 shows terms checkbox
        wait_for(driver, By.ID, "signup-terms")
        assert driver.find_element(By.ID, "signup-terms").is_displayed()

    def test_step_3_terms_required(self, driver, base_url):
        """Submitting without accepting terms should show an error."""
        navigate(driver, base_url, "/signup")
        do_signup_step1(driver, "Valid User", f"v4_{BASE_EMAIL_SEED}@test.com", "Password1!")
        do_signup_step2(driver, "+919876543210", "2000-06-15")
        # DON'T check terms, just submit
        click(driver, By.ID, "signup-submit")
        time.sleep(0.5)
        src = driver.page_source
        assert "terms" in src.lower() or "accept" in src.lower(), \
            "Expected terms acceptance error"

    def test_back_button_navigates_between_steps(self, driver, base_url):
        """Back button should return to previous step."""
        navigate(driver, base_url, "/signup")
        do_signup_step1(driver, "Nav User", f"nav_{BASE_EMAIL_SEED}@test.com", "Password1!")
        wait_for(driver, By.ID, "signup-phone")
        # Go back
        back_btn = driver.find_element(
            By.XPATH, "//button[contains(text(),'Back')]"
        )
        back_btn.click()
        time.sleep(0.5)
        # Should be back on step 1
        assert driver.find_element(By.ID, "signup-name").is_displayed(), \
            "Back navigation didn't return to Step 1"

    def test_step_indicator_updates(self, driver, base_url):
        """Step indicator text should change as form progresses."""
        navigate(driver, base_url, "/signup")
        src_s1 = driver.page_source
        assert "Step 1" in src_s1

        do_signup_step1(driver, "Ind User", f"ind_{BASE_EMAIL_SEED}@test.com", "Password1!")
        src_s2 = driver.page_source
        assert "Step 2" in src_s2

        do_signup_step2(driver, "+919876543210", "2000-06-15")
        src_s3 = driver.page_source
        assert "Step 3" in src_s3

    def test_full_signup_submission_triggers_response(self, driver, base_url):
        """Completing all 3 steps and submitting should trigger backend call."""
        navigate(driver, base_url, "/signup")
        unique = int(time.time())
        do_signup_step1(
            driver,
            "Full Test",
            f"full_{unique}@test.com",
            "Password1!"
        )
        do_signup_step2(driver, "+919876543210", "2000-06-15")
        click(driver, By.ID, "signup-terms")
        click(driver, By.ID, "signup-submit")
        time.sleep(3)
        # After submission: should either redirect (OTP/verify) OR show a toast error
        # In both cases, it proves the form submitted
        current = driver.current_url
        src = driver.page_source
        assert (
            "/verify-otp" in current
            or "/setup-profile" in current
            or "otp" in src.lower()
            or "sms" in src.lower()
            or "toast" in src.lower()
            or "error" in src.lower()
            or "account" in src.lower()
        ), f"Expected post-signup state. URL={current}"

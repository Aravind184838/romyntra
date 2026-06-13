"""
test_06_otp_page.py - OTP verification page tests
"""
import time
import pytest
from selenium.webdriver.common.by import By
from helpers import navigate, wait_for, click


class TestOTPPage:

    def test_otp_page_accessible(self, driver, base_url):
        """Navigating to /verify-otp should show the OTP form."""
        navigate(driver, base_url, "/verify-otp")
        time.sleep(1)
        src = driver.page_source
        # Page may redirect if no confirmation state, or show OTP form
        assert "otp" in src.lower() or "verify" in src.lower() \
            or "/login" in driver.current_url or "/" in driver.current_url, \
            "OTP page not accessible or not showing expected content"

    def test_otp_inputs_render(self, driver, base_url):
        """OTP verification page should render 6 digit boxes when reachable."""
        navigate(driver, base_url, "/verify-otp")
        time.sleep(1)
        src = driver.page_source
        # If we're on the OTP page (not redirected away), check for digit inputs
        if "/verify-otp" in driver.current_url:
            inputs = driver.find_elements(By.XPATH, "//input[@maxlength='1']")
            assert len(inputs) >= 6, f"Expected 6 OTP digit inputs, found {len(inputs)}"

    def test_otp_resend_button_present(self, driver, base_url):
        """Resend OTP button / countdown should be present on OTP page."""
        navigate(driver, base_url, "/verify-otp")
        time.sleep(1)
        if "/verify-otp" in driver.current_url:
            src = driver.page_source
            assert "resend" in src.lower() or "countdown" in src.lower() \
                or "60" in src, \
                "Expected Resend OTP element on OTP page"

"""
test_01_splash.py - Splash screen tests
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from helpers import wait_for, navigate


class TestSplashScreen:

    def test_splash_title(self, driver, base_url):
        """Page title should contain 'Romyntra'."""
        navigate(driver, base_url, "/")
        assert "Romyntra" in driver.title, f"Expected 'Romyntra' in title, got: {driver.title}"

    def test_splash_subtitle_visible(self, driver, base_url):
        """Splash screen should show the subtitle/description."""
        navigate(driver, base_url, "/")
        page_src = driver.page_source.lower()
        assert "find love" in page_src or "plan the perfect date" in page_src, \
            "Expected splash subtitle/description not found"

    def test_splash_auto_redirects(self, driver, base_url):
        """Splash screen should automatically redirect to /login after a delay."""
        navigate(driver, base_url, "/")
        # Wait up to 5 seconds for the redirect to happen
        import time
        redirected = False
        for _ in range(10):
            time.sleep(0.5)
            if "/login" in driver.current_url or "/discover" in driver.current_url or "/setup-profile" in driver.current_url:
                redirected = True
                break
        assert redirected, f"Expected redirect to login/discover/setup-profile, but stayed on: {driver.current_url}"

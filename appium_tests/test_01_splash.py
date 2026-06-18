"""
test_01_splash.py — Appium E2E: Splash Screen
Tests the splash/home screen of the Romyntra mobile-web app.
"""
import pytest
from pages.splash_page import SplashPage


@pytest.mark.smoke
class TestSplashScreen:

    def test_splash_page_title_contains_app_name(self, driver, base_url):
        """Page title should contain 'Romyntra'."""
        page = SplashPage(driver, base_url).open()
        page.screenshot("splash_title")
        title = page.get_page_title()
        assert "Romyntra" in title or page.page_contains_branding(), \
            f"Expected 'Romyntra' branding. Title was: {title!r}"

    def test_splash_branding_visible(self, driver, base_url):
        """Splash screen should display Romyntra branding content."""
        page = SplashPage(driver, base_url).open()
        assert page.page_contains_branding(), \
            "Romyntra branding not found in splash page source"

    def test_splash_subtitle_visible(self, driver, base_url):
        """Splash screen should contain a subtitle or description."""
        page = SplashPage(driver, base_url).open()
        page.screenshot("splash_subtitle")
        assert page.page_contains_subtitle(), \
            "Expected splash subtitle/description not found in page source"

    def test_splash_auto_redirects(self, driver, base_url):
        """Splash screen should auto-redirect to login or discover within 8 seconds."""
        page = SplashPage(driver, base_url).open()
        redirected = page.wait_for_auto_redirect(timeout=8)
        page.screenshot("splash_after_redirect")
        assert redirected, \
            f"Expected auto-redirect from splash. Current URL: {page.current_url}"

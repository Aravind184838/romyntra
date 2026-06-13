"""
test_05_ui_elements.py - UI / visual quality tests
"""
import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from helpers import navigate, wait_for


class TestUIElements:

    # ── Splash ────────────────────────────────────────────────────────────────
    def test_splash_has_app_name(self, driver, base_url):
        navigate(driver, base_url, "/")
        assert "Romyntra" in driver.page_source

    def test_splash_has_heart_icon_or_emoji(self, driver, base_url):
        navigate(driver, base_url, "/")
        src = driver.page_source
        assert "💘" in src or "❤" in src or "heart" in src.lower(), \
            "Expected heart/love icon on splash"

    # ── Login ─────────────────────────────────────────────────────────────────
    def test_login_has_logo(self, driver, base_url):
        navigate(driver, base_url, "/login")
        src = driver.page_source
        assert "Romyntra" in src or "💘" in src

    def test_login_email_input_has_placeholder(self, driver, base_url):
        navigate(driver, base_url, "/login")
        el = driver.find_element(By.ID, "login-email")
        ph = el.get_attribute("placeholder")
        assert ph and len(ph) > 0, "Email input missing placeholder"

    def test_login_password_input_exists(self, driver, base_url):
        navigate(driver, base_url, "/login")
        pw = driver.find_element(By.ID, "login-password")
        assert pw.get_attribute("type") == "password"

    def test_login_submit_button_text(self, driver, base_url):
        navigate(driver, base_url, "/login")
        btn = driver.find_element(By.ID, "login-submit")
        assert "sign" in btn.text.lower() or "login" in btn.text.lower(), \
            f"Submit button text unexpected: {btn.text}"

    # ── Signup ────────────────────────────────────────────────────────────────
    def test_signup_progress_bar_visible(self, driver, base_url):
        """Progress bar / step indicator should be visible on signup."""
        navigate(driver, base_url, "/signup")
        src = driver.page_source
        assert "Step 1" in src or "step" in src.lower()

    def test_signup_next_button_exists(self, driver, base_url):
        navigate(driver, base_url, "/signup")
        btn = driver.find_element(By.ID, "signup-next")
        assert btn.is_displayed()

    def test_signup_page_heading(self, driver, base_url):
        navigate(driver, base_url, "/signup")
        src = driver.page_source
        assert "Join Romyntra" in src or "romyntra" in src.lower()

    # ── Responsiveness ────────────────────────────────────────────────────────
    def test_mobile_viewport_login(self, driver, base_url):
        """Login page should not break at mobile width (375px)."""
        driver.set_window_size(375, 812)
        navigate(driver, base_url, "/login")
        time.sleep(0.5)
        # Basic check: email input still exists and is interactable
        el = driver.find_element(By.ID, "login-email")
        assert el.is_displayed(), "Email input not visible on mobile viewport"
        driver.set_window_size(1280, 900)  # restore

    def test_tablet_viewport_login(self, driver, base_url):
        """Login page should render on tablet (768px)."""
        driver.set_window_size(768, 1024)
        navigate(driver, base_url, "/login")
        time.sleep(0.5)
        el = driver.find_element(By.ID, "login-email")
        assert el.is_displayed()
        driver.set_window_size(1280, 900)

    # ── Page titles ───────────────────────────────────────────────────────────
    def test_page_title_signup(self, driver, base_url):
        navigate(driver, base_url, "/signup")
        assert "Romyntra" in driver.title

    def test_page_title_login(self, driver, base_url):
        navigate(driver, base_url, "/login")
        assert "Romyntra" in driver.title

    # ── No broken 404 images ──────────────────────────────────────────────────
    def test_no_broken_images_login(self, driver, base_url):
        """Check that all <img> elements have a non-empty src."""
        navigate(driver, base_url, "/login")
        imgs = driver.find_elements(By.TAG_NAME, "img")
        for img in imgs:
            src = img.get_attribute("src") or ""
            assert src and "undefined" not in src, f"Broken image src: {src}"

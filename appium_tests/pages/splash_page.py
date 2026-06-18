"""
pages/splash_page.py — Page Object for the Romyntra Splash Screen.
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class SplashPage(BasePage):

    # ── Locators ──────────────────────────────────────────────────────────
    TITLE_TEXT     = (By.XPATH, "//*[contains(@class,'splash') or contains(text(),'Romyntra')]")
    SUBTITLE_TEXT  = (By.XPATH, "//*[contains(text(),'love') or contains(text(),'date') or contains(text(),'plan')]")
    ANY_BUTTON     = (By.XPATH, "//button")

    # ── Actions ───────────────────────────────────────────────────────────

    def open(self):
        self.navigate("/")
        return self

    def get_page_title(self) -> str:
        return self.driver.title

    def page_contains_branding(self) -> bool:
        src = self.page_source.lower()
        return "romyntra" in src

    def page_contains_subtitle(self) -> bool:
        src = self.page_source.lower()
        return (
            "find love" in src
            or "plan the perfect date" in src
            or "dating" in src
            or "match" in src
        )

    def wait_for_auto_redirect(self, timeout: int = 8) -> bool:
        """Wait for auto-redirect away from '/' splash screen."""
        import time
        for _ in range(timeout * 2):
            time.sleep(0.5)
            url = self.current_url
            if (
                "/login" in url
                or "/discover" in url
                or "/setup-profile" in url
                or "/matches" in url
            ):
                return True
        return False

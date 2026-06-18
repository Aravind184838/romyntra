"""
pages/base_page.py — Base Page Object with shared helpers for all Romyntra pages.
"""
import time
import logging
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

logger = logging.getLogger("romyntra.appium")


class BasePage:
    """
    Every page object inherits from BasePage.
    Provides:
      - navigate()     — go to a path
      - find()         — wait + return element
      - click()        — wait + click element
      - fill()         — wait + clear + type text
      - is_visible()   — non-raising presence check
      - page_source    — current DOM text
      - current_url    — current browser URL
      - screenshot()   — save a screenshot
    """

    DEFAULT_TIMEOUT = 20

    def __init__(self, driver, base_url: str):
        self.driver   = driver
        self.base_url = base_url.rstrip("/")
        self.wait     = WebDriverWait(driver, self.DEFAULT_TIMEOUT)

    # ── Navigation ────────────────────────────────────────────────────────

    def navigate(self, path: str = ""):
        url = f"{self.base_url}{path}"
        logger.info(f"  → navigate to {url}")
        self.driver.get(url)
        time.sleep(0.6)

    @property
    def current_url(self) -> str:
        return self.driver.current_url

    @property
    def page_source(self) -> str:
        return self.driver.page_source

    # ── Element Helpers ───────────────────────────────────────────────────

    def find(self, by, locator, timeout: int | None = None):
        t = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located((by, locator)),
            message=f"Element not visible: ({by}, {locator!r})"
        )

    def click(self, by, locator, timeout: int | None = None):
        t = timeout or self.DEFAULT_TIMEOUT
        el = WebDriverWait(self.driver, t).until(
            EC.element_to_be_clickable((by, locator)),
            message=f"Element not clickable: ({by}, {locator!r})"
        )
        el.click()
        return el

    def fill(self, by, locator, text: str, clear: bool = True, timeout: int | None = None):
        el = self.find(by, locator, timeout)
        if clear:
            el.clear()
        el.send_keys(text)
        return el

    def is_visible(self, by, locator, timeout: int = 5) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, locator))
            )
            return True
        except (TimeoutException, NoSuchElementException):
            return False

    def is_present(self, by, locator, timeout: int = 5) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, locator))
            )
            return True
        except (TimeoutException, NoSuchElementException):
            return False

    def get_text(self, by, locator, timeout: int | None = None) -> str:
        try:
            return self.find(by, locator, timeout).text
        except Exception:
            return ""

    # ── Screenshot ────────────────────────────────────────────────────────

    def screenshot(self, name: str, save_dir: str = "Test Results/Screenshots"):
        import os
        os.makedirs(save_dir, exist_ok=True)
        ts   = time.strftime("%Y%m%d_%H%M%S")
        path = os.path.join(save_dir, f"{name}_{ts}.png")
        try:
            self.driver.save_screenshot(path)
            logger.info(f"  📸 Screenshot: {path}")
        except Exception as e:
            logger.warning(f"  Could not save screenshot: {e}")
        return path

    # ── Utilities ─────────────────────────────────────────────────────────

    def wait_for_url_contains(self, fragment: str, timeout: int = 15) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.url_contains(fragment)
            )
            return True
        except TimeoutException:
            return False

    def get_toast_text(self, timeout: int = 8) -> str:
        """Return the first react-hot-toast notification text."""
        from selenium.webdriver.common.by import By
        try:
            el = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, "//*[@role='status']"))
            )
            return el.text
        except Exception:
            return ""

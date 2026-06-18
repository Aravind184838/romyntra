"""
conftest.py — Shared fixtures and configuration for Romyntra Appium E2E tests.

Tests run against the Romyntra web app inside the Android Chrome browser
on a real emulator (or physical device) via Appium 2.x.

Environment variables (set by the CI workflow):
  APPIUM_HOST       — Appium server host (default: 127.0.0.1)
  APPIUM_PORT       — Appium server port (default: 4723)
  BASE_URL          — The app URL accessible from the Android device
                      In CI: http://10.0.2.2:5173  (emulator loopback)
                      Locally: http://192.168.x.x:5173 (your LAN IP)
  API_URL           — Backend API base URL
  SCREENSHOTS_DIR   — Where to save screenshots
  LOGS_DIR          — Where to save logs
"""
import os
import time
import logging
import pytest

from appium import webdriver
from appium.options import UiAutomator2Options
from selenium.webdriver.support.ui import WebDriverWait


# ── Configuration ─────────────────────────────────────────────────────────────

APPIUM_HOST     = os.environ.get("APPIUM_HOST", "127.0.0.1")
APPIUM_PORT     = int(os.environ.get("APPIUM_PORT", "4723"))
BASE_URL        = os.environ.get("BASE_URL", "http://10.0.2.2:5173")
API_URL         = os.environ.get("API_URL",  "http://10.0.2.2:5000/api")
SCREENSHOTS_DIR = os.environ.get("SCREENSHOTS_DIR", "Test Results/Screenshots")
LOGS_DIR        = os.environ.get("LOGS_DIR", "Test Results/Logs")

# Ensure directories exist
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(LOGS_DIR, "test-run.log"), encoding="utf-8"),
    ]
)
logger = logging.getLogger("romyntra.appium")


# ── Reusable Test Data ────────────────────────────────────────────────────────

TEST_USER = {
    "name":     "Appium Tester",
    "email":    f"appium_{int(time.time())}@test.com",
    "phone":    "+919000000001",
    "password": "Test@1234",
    "dob":      "2000-03-15",
    "gender":   "not-specified",
}


# ── Appium Driver Fixture ─────────────────────────────────────────────────────

def _build_options() -> UiAutomator2Options:
    """Build Appium capabilities for Android Chrome."""
    options = UiAutomator2Options()
    options.platform_name           = "Android"
    options.automation_name         = "UiAutomator2"
    options.browser_name            = "Chrome"
    options.device_name             = "Romyntra_E2E"
    options.no_reset                = True
    options.full_reset              = False
    options.auto_grant_permissions  = True

    # Chrome-specific options for mobile web
    options.set_capability("goog:chromeOptions", {
        "args": [
            "--no-first-run",
            "--disable-fre",
            "--no-default-browser-check",
            "--disable-notifications",
        ]
    })
    return options


@pytest.fixture(scope="session")
def driver():
    """Single Appium Chrome session shared across the entire test run."""
    appium_url = f"http://{APPIUM_HOST}:{APPIUM_PORT}"
    logger.info(f"Connecting to Appium at {appium_url}")

    options = _build_options()
    drv = webdriver.Remote(appium_url, options=options)
    drv.implicitly_wait(15)

    logger.info("✅ Appium driver created — Android Chrome session active")
    yield drv

    logger.info("Quitting Appium driver session")
    drv.quit()


@pytest.fixture(scope="function")
def wait(driver):
    """Per-test explicit wait."""
    return WebDriverWait(driver, 20)


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_url():
    return API_URL


# ── Screenshot on Failure ─────────────────────────────────────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()

    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("driver")
        if driver:
            ts   = time.strftime("%Y%m%d_%H%M%S")
            name = item.name.replace("/", "_").replace(" ", "_")
            path = os.path.join(SCREENSHOTS_DIR, f"FAIL_{name}_{ts}.png")
            try:
                driver.save_screenshot(path)
                logger.info(f"📸 Screenshot saved: {path}")
            except Exception as e:
                logger.warning(f"Could not save screenshot: {e}")

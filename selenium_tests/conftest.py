"""
conftest.py - Shared fixtures and configuration for Romyntra Selenium tests
"""
import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173"
API_URL  = "http://localhost:5000/api"

# ── Reusable test data ──────────────────────────────────────────────────────
TEST_USER = {
    "name":    "Selenium Tester",
    "email":   f"selenium_{int(time.time())}@test.com",
    "phone":   "+919999999999",
    "password": "Test@1234",
    "dob":     "2000-01-15",
}


import os

# ── Driver fixture ──────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def driver():
    """Single Chrome session for the entire test run."""
    options = Options()
    if os.environ.get("CI") == "true":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=options)
    drv.implicitly_wait(10)
    yield drv
    drv.quit()


@pytest.fixture(scope="function")
def wait(driver):
    return WebDriverWait(driver, 15)


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL

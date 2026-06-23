"""
helpers.py - Reusable page-action helpers for Romyntra Selenium tests
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def wait_for(driver, by, selector, timeout=15):
    """Wait until element is visible and return it."""
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, selector))
    )


def click(driver, by, selector, timeout=15):
    el = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, selector))
    )
    el.click()
    return el


def fill(driver, by, selector, text, clear=True, timeout=15):
    el = wait_for(driver, by, selector, timeout)
    if clear:
        el.clear()
    el.send_keys(text)
    return el


def get_toast_text(driver, timeout=10):
    """Return the text of the first react-hot-toast notification."""
    try:
        el = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.XPATH, "//div[@role='status']"))
        )
        return el.text
    except Exception:
        return ""


def navigate(driver, base_url, path=""):
    """Navigate to a HashRouter route.

    HashRouter routes use the fragment (#) so GitHub Pages static hosting
    serves them correctly.
    Example: navigate(driver, 'http://localhost:5173', '/login')
             → driver.get('http://localhost:5173/#/login')
    """
    # Normalize: strip trailing slash from base, leading slash from path
    base = base_url.rstrip("/")
    route = path.lstrip("/")
    url = f"{base}/#{('/' + route) if route else '/'}"
    driver.get(url)
    driver.refresh()
    time.sleep(0.5)


def get_hash_path(driver):
    """Extracts the hash part of the URL (e.g., '/discover' from 'http://localhost:5173/#/discover')."""
    url = driver.current_url
    if "#" in url:
        hash_part = url.split("#", 1)[1]
        path = hash_part.split("?", 1)[0]
        if not path:
            return "/"
        return path if path.startswith("/") else "/" + path
    return "/"


# ── Page-level helpers ──────────────────────────────────────────────────────

def go_to_login(driver, base_url):
    navigate(driver, base_url, "/login")


def do_login(driver, base_url, email, password):
    """Perform email login and return True on success."""
    go_to_login(driver, base_url)
    # Make sure Email tab is selected (default)
    try:
        email_tab = driver.find_element(By.XPATH, "//button[contains(text(),'Email')]")
        email_tab.click()
    except Exception:
        pass
    fill(driver, By.ID, "login-email", email)
    fill(driver, By.ID, "login-password", password)
    click(driver, By.ID, "login-submit")
    time.sleep(1.5)


def do_signup_step1(driver, name, email, password):
    fill(driver, By.ID, "signup-name",     name)
    fill(driver, By.ID, "signup-email",    email)
    fill(driver, By.ID, "signup-password", password)
    fill(driver, By.XPATH, "//input[@placeholder='Repeat password']", password)
    click(driver, By.ID, "signup-next")
    # Wait for Step 2 element to be visible
    wait_for(driver, By.ID, "signup-phone")


def do_signup_step2(driver, phone, dob):
    fill(driver, By.ID, "signup-phone", phone)
    fill(driver, By.ID, "signup-dob",   dob)
    click(driver, By.ID, "signup-next")
    # Wait for Step 3 element to be visible
    wait_for(driver, By.ID, "signup-terms")


def do_signup_step3(driver):
    click(driver, By.ID, "signup-terms")
    click(driver, By.ID, "signup-submit")
    time.sleep(1.5)

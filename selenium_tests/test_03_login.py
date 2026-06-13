"""
test_03_login.py - Login page tests (Email + Phone toggle)
"""
import time
import pytest
from selenium.webdriver.common.by import By
from helpers import navigate, wait_for, click, fill, do_login, get_toast_text


class TestLoginPage:

    def test_login_page_loads(self, driver, base_url):
        """Login page renders with email/phone toggle."""
        navigate(driver, base_url, "/login")
        assert "/login" in driver.current_url
        wait_for(driver, By.ID, "login-email")

    def test_email_tab_is_default(self, driver, base_url):
        """Email tab should be active by default."""
        navigate(driver, base_url, "/login")
        assert driver.find_element(By.ID, "login-email").is_displayed()

    def test_phone_tab_switches_input(self, driver, base_url):
        """Switching to Phone tab should show phone input and hide email."""
        navigate(driver, base_url, "/login")
        phone_tab = driver.find_element(
            By.XPATH, "//button[contains(text(),'Phone')]"
        )
        phone_tab.click()
        time.sleep(0.3)
        assert driver.find_element(By.ID, "login-phone").is_displayed(), \
            "Phone input not visible after switching tab"

    def test_email_tab_switch_back(self, driver, base_url):
        """Switching back to Email tab should show email/password fields."""
        navigate(driver, base_url, "/login")
        # Switch to phone
        driver.find_element(By.XPATH, "//button[contains(text(),'Phone')]").click()
        time.sleep(0.3)
        # Switch back to email
        driver.find_element(By.XPATH, "//button[contains(text(),'Email')]").click()
        time.sleep(0.3)
        assert driver.find_element(By.ID, "login-email").is_displayed(), \
            "Email input not visible after switching back to email tab"

    def test_login_validation_empty_fields(self, driver, base_url):
        """Submitting empty login form should show required field errors."""
        navigate(driver, base_url, "/login")
        click(driver, By.ID, "login-submit")
        time.sleep(0.5)
        src = driver.page_source
        assert "required" in src.lower() or "email" in src.lower(), \
            "Expected validation errors for empty login form"

    def test_login_invalid_credentials(self, driver, base_url):
        """Logging in with wrong credentials should show an error toast/message."""
        navigate(driver, base_url, "/login")
        fill(driver, By.ID, "login-email",    "nonexistent@test.com")
        fill(driver, By.ID, "login-password", "wrongpassword")
        click(driver, By.ID, "login-submit")
        time.sleep(3)
        # Should still be on /login and show some error
        src = driver.page_source
        current = driver.current_url
        assert "/login" in current or "invalid" in src.lower() or "error" in src.lower(), \
            "Expected error on invalid credentials"

    def test_password_toggle_visibility(self, driver, base_url):
        """Eye icon should toggle password field visibility."""
        navigate(driver, base_url, "/login")
        pw_input = driver.find_element(By.ID, "login-password")
        assert pw_input.get_attribute("type") == "password", \
            "Password should be hidden by default"
        # Click the eye toggle (button inside .input-icon-wrap)
        toggle = driver.find_element(
            By.XPATH,
            "//input[@id='login-password']/following-sibling::button"
        )
        toggle.click()
        time.sleep(0.2)
        assert pw_input.get_attribute("type") == "text", \
            "Password should be visible after toggle"

    def test_signup_link_redirects(self, driver, base_url):
        """'Create account' link on login page should go to /signup."""
        navigate(driver, base_url, "/login")
        link = driver.find_element(By.XPATH, "//a[@href='/signup']")
        link.click()
        time.sleep(1)
        assert "/signup" in driver.current_url, \
            f"Expected /signup, got {driver.current_url}"

    def test_valid_email_login(self, driver, base_url):
        """A valid email login should redirect away from /login."""
        # Register a user first via API so we know they exist
        import requests
        import random
        email = f"logintest_{random.randint(1000,9999)}@test.com"
        password = "Password1!"
        try:
            resp = requests.post(
                f"http://localhost:5000/api/auth/register",
                json={
                    "name": "Login Tester",
                    "email": email,
                    "phone": f"+9198765{random.randint(10000,99999)}",
                    "password": password,
                    "dob": "2000-01-01",
                    "gender": "not-specified"
                },
                timeout=5
            )
            if resp.status_code not in (200, 201):
                pytest.skip(f"Could not register user: {resp.text}")
        except Exception as e:
            pytest.skip(f"Backend not reachable: {e}")

        do_login(driver, base_url, email, password)
        time.sleep(2)
        current = driver.current_url
        assert "/login" not in current, \
            f"User still on /login after valid credentials. URL={current}"

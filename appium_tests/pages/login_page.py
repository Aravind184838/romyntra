"""
pages/login_page.py — Page Object for the Romyntra Login Page.
"""
import time
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LoginPage(BasePage):

    # ── Locators ──────────────────────────────────────────────────────────
    EMAIL_INPUT     = (By.ID, "login-email")
    PASSWORD_INPUT  = (By.ID, "login-password")
    SUBMIT_BUTTON   = (By.ID, "login-submit")
    PHONE_TAB       = (By.XPATH, "//button[contains(text(),'Phone')]")
    EMAIL_TAB       = (By.XPATH, "//button[contains(text(),'Email')]")
    PHONE_INPUT     = (By.ID, "login-phone")
    SIGNUP_LINK     = (By.XPATH, "//a[contains(@href, 'signup')]")
    PW_TOGGLE       = (By.XPATH, "//input[@id='login-password']/following-sibling::button")

    # ── Actions ───────────────────────────────────────────────────────────

    def open(self):
        self.navigate("/login")
        return self

    def is_loaded(self) -> bool:
        return self.is_visible(*self.EMAIL_INPUT)

    def enter_email(self, email: str):
        self.fill(*self.EMAIL_INPUT, email)

    def enter_password(self, password: str):
        self.fill(*self.PASSWORD_INPUT, password)

    def submit(self):
        self.click(*self.SUBMIT_BUTTON)
        time.sleep(1.5)

    def login(self, email: str, password: str):
        self.open()
        self.enter_email(email)
        self.enter_password(password)
        self.submit()

    def switch_to_phone_tab(self):
        self.click(*self.PHONE_TAB)
        time.sleep(0.4)

    def switch_to_email_tab(self):
        self.click(*self.EMAIL_TAB)
        time.sleep(0.4)

    def is_phone_input_visible(self) -> bool:
        return self.is_visible(*self.PHONE_INPUT)

    def is_email_input_visible(self) -> bool:
        return self.is_visible(*self.EMAIL_INPUT)

    def toggle_password_visibility(self):
        self.click(*self.PW_TOGGLE)
        time.sleep(0.3)

    def get_password_input_type(self) -> str:
        try:
            el = self.find(*self.PASSWORD_INPUT, timeout=5)
            return el.get_attribute("type") or "password"
        except Exception:
            return "password"

    def click_signup_link(self):
        self.click(*self.SIGNUP_LINK)
        time.sleep(1)

    def get_validation_error(self) -> str:
        return self.page_source.lower()

    def is_redirected_away_from_login(self) -> bool:
        return "/login" not in self.current_url

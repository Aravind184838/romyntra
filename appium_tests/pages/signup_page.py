"""
pages/signup_page.py — Page Object for the Romyntra Signup Page (3-step form).
"""
import time
from selenium.webdriver.common.by import By
from .base_page import BasePage


class SignupPage(BasePage):

    # ── Step 1 Locators ───────────────────────────────────────────────────
    NAME_INPUT      = (By.ID, "signup-name")
    EMAIL_INPUT     = (By.ID, "signup-email")
    PASSWORD_INPUT  = (By.ID, "signup-password")
    CONFIRM_INPUT   = (By.XPATH, "//input[@placeholder='Repeat password']")
    NEXT_BUTTON     = (By.ID, "signup-next")
    BACK_BUTTON     = (By.XPATH, "//button[contains(text(),'Back')]")

    # ── Step 2 Locators ───────────────────────────────────────────────────
    PHONE_INPUT     = (By.ID, "signup-phone")
    DOB_INPUT       = (By.ID, "signup-dob")

    # ── Step 3 Locators ───────────────────────────────────────────────────
    TERMS_CHECKBOX  = (By.ID, "signup-terms")
    SUBMIT_BUTTON   = (By.ID, "signup-submit")

    # ── Login Link ────────────────────────────────────────────────────────
    LOGIN_LINK      = (By.XPATH, "//a[contains(@href, 'login')]")

    # ── Actions ───────────────────────────────────────────────────────────

    def open(self):
        self.navigate("/signup")
        return self

    def is_loaded(self) -> bool:
        return self.is_visible(*self.NAME_INPUT)

    def fill_step1(self, name: str, email: str, password: str, confirm: str | None = None):
        self.fill(*self.NAME_INPUT, name)
        self.fill(*self.EMAIL_INPUT, email)
        self.fill(*self.PASSWORD_INPUT, password)
        self.fill(*self.CONFIRM_INPUT, confirm or password)

    def next_step(self):
        self.click(*self.NEXT_BUTTON)
        time.sleep(0.6)

    def back_step(self):
        self.click(*self.BACK_BUTTON)
        time.sleep(0.6)

    def fill_step2(self, phone: str, dob: str):
        self.fill(*self.PHONE_INPUT, phone)
        self.fill(*self.DOB_INPUT, dob)

    def accept_terms(self):
        self.click(*self.TERMS_CHECKBOX)
        time.sleep(0.3)

    def submit(self):
        self.click(*self.SUBMIT_BUTTON)
        time.sleep(3)

    def complete_signup(self, name: str, email: str, password: str,
                        phone: str, dob: str):
        """Full 3-step signup flow."""
        self.open()
        self.fill_step1(name, email, password)
        self.next_step()
        self.fill_step2(phone, dob)
        self.next_step()
        self.accept_terms()
        self.submit()

    def is_on_step(self, step_number: int) -> bool:
        return f"Step {step_number}" in self.page_source

    def get_validation_text(self) -> str:
        return self.page_source.lower()

    def is_step2_visible(self) -> bool:
        return self.is_visible(*self.PHONE_INPUT)

    def is_step3_visible(self) -> bool:
        return self.is_visible(*self.TERMS_CHECKBOX)

    def is_step1_visible(self) -> bool:
        return self.is_visible(*self.NAME_INPUT)

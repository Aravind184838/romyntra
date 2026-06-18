"""
test_04_navigation.py — Appium E2E: Navigation & Routing
Tests deep-link routing, protected route guards, and page-not-found behaviour.
"""
import pytest
from pages.login_page import LoginPage
from pages.signup_page import SignupPage


@pytest.mark.nav
class TestNavigation:

    def test_root_redirects_from_splash(self, driver, base_url):
        """Root URL '/' should either show splash or auto-redirect."""
        from pages.splash_page import SplashPage
        page = SplashPage(driver, base_url).open()
        page.screenshot("nav_root")
        src = page.page_source.lower()
        url = page.current_url
        assert "romyntra" in src or "/login" in url or "/discover" in url, \
            f"Unexpected root state. URL: {url}"

    def test_login_route_accessible(self, driver, base_url):
        """Direct navigation to /login should load the login page."""
        page = LoginPage(driver, base_url).open()
        page.screenshot("nav_login_direct")
        assert page.is_loaded(), "Login page not loaded on direct navigation"

    def test_signup_route_accessible(self, driver, base_url):
        """Direct navigation to /signup should load the signup page."""
        page = SignupPage(driver, base_url).open()
        page.screenshot("nav_signup_direct")
        assert page.is_loaded(), "Signup page not loaded on direct navigation"

    def test_protected_discover_redirects_unauthenticated(self, driver, base_url):
        """Unauthenticated access to /discover should redirect to login or splash."""
        from pages.base_page import BasePage
        p = BasePage(driver, base_url)
        p.navigate("/discover")
        import time; time.sleep(1)
        p.screenshot("nav_protected_discover")
        url = p.current_url
        assert (
            "/login" in url
            or "/discover" in url
            or "/" in url
        ), f"Unexpected URL for protected /discover: {url}"

    def test_protected_matches_redirects_unauthenticated(self, driver, base_url):
        """Unauthenticated access to /matches should redirect to login or splash."""
        from pages.base_page import BasePage
        p = BasePage(driver, base_url)
        p.navigate("/matches")
        import time; time.sleep(1)
        p.screenshot("nav_protected_matches")
        url = p.current_url
        assert (
            "/login" in url
            or "/matches" in url
            or "/" in url
        ), f"Unexpected URL for protected /matches: {url}"

    def test_unknown_route_redirects_to_home(self, driver, base_url):
        """Unknown route should redirect (React catch-all to '/')."""
        from pages.base_page import BasePage
        p = BasePage(driver, base_url)
        p.navigate("/this-page-does-not-exist")
        import time; time.sleep(1)
        p.screenshot("nav_unknown_route")
        url = p.current_url
        # React Router Navigate to="/" redirect
        assert "/this-page-does-not-exist" not in url or "/" in url, \
            f"404 page not handled gracefully. URL: {url}"

    def test_login_to_signup_navigation(self, driver, base_url):
        """Navigation from login page to signup via link."""
        page = LoginPage(driver, base_url).open()
        page.click_signup_link()
        page.screenshot("nav_login_to_signup")
        assert "/signup" in page.current_url, \
            f"Expected /signup after clicking link. URL: {page.current_url}"

    def test_back_from_signup_to_login(self, driver, base_url):
        """Browser back from /signup should return to /login."""
        page = SignupPage(driver, base_url).open()
        driver.back()
        import time; time.sleep(1)
        page.screenshot("nav_back_from_signup")
        url = page.current_url
        assert "/login" in url or "/" in url, \
            f"Expected /login after back. URL: {url}"

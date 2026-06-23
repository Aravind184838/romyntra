/**
 * driver.js — Shared Selenium WebDriver factory for Romyntra E2E tests.
 *
 * The BASE_URL is read from the BASE_URL environment variable.
 * In CI it points to the live GitHub Pages URL.
 * Locally it defaults to http://localhost:5173
 *
 * URL scheme for HashRouter:
 *   GitHub Pages:  https://USERNAME.github.io/REPO/#/login
 *   Local dev:     http://localhost:5173/#/login
 */
'use strict';

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// ── Configuration ──────────────────────────────────────────────────────────
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const API_URL  = (process.env.API_URL  || 'http://localhost:5000/api').replace(/\/$/, '');
const HEADLESS = process.env.HEADLESS !== 'false'; // headless by default in CI
const TIMEOUT  = parseInt(process.env.SELENIUM_TIMEOUT || '20000', 10);

/**
 * Build a Chrome WebDriver instance.
 * @returns {Promise<WebDriver>}
 */
async function buildDriver() {
  const opts = new chrome.Options();

  if (HEADLESS) {
    opts.addArguments('--headless=new');
  }
  opts.addArguments(
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-infobars',
    '--disable-extensions',
    '--disable-blink-features=AutomationControlled',
  );
  opts.excludeSwitches(['enable-automation']);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(opts)
    .build();

  driver.manage().setTimeouts({ implicit: TIMEOUT });
  return driver;
}

/**
 * Navigate to a hash route.
 * e.g. navigateTo(driver, '/login') → BASE_URL/#/login
 */
async function navigateTo(driver, path = '') {
  const url = `${BASE_URL}/#${path}`;
  await driver.get(url);
  await driver.navigate().refresh();
  await driver.sleep(700);
}

/**
 * Wait for an element to be visible and return it.
 */
async function waitFor(driver, locator, timeout = TIMEOUT) {
  return driver.wait(until.elementIsVisible(await driver.findElement(locator)), timeout);
}

/**
 * Fill an input element (clear first, then type).
 */
async function fill(driver, locator, text) {
  const el = await waitFor(driver, locator);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

/**
 * Click an element after waiting for it to be clickable.
 */
async function click(driver, locator, timeout = TIMEOUT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  await el.click();
  return el;
}

/**
 * Get page source text (lower-cased for assertions).
 */
async function getSource(driver) {
  return (await driver.getPageSource()).toLowerCase();
}

/**
 * Register a user via the backend REST API.
 * Returns { email, password } on success, null on failure.
 */
async function registerUser(overrides = {}) {
  const axios = require('axios');
  const ts    = Date.now();
  const user  = {
    name:     overrides.name     || `Selenium ${ts}`,
    email:    overrides.email    || `sel_${ts}@test.com`,
    phone:    overrides.phone    || `+9190000${String(ts).slice(-5)}`,
    password: overrides.password || 'Password1!',
    dob:      overrides.dob      || '2000-01-01',
    gender:   overrides.gender   || 'not-specified',
  };
  try {
    const resp = await axios.post(`${API_URL}/auth/register`, user, { timeout: 8000 });
    if (resp.status === 200 || resp.status === 201) return user;
  } catch (_) { /* fall-through */ }
  return null;
}

module.exports = {
  buildDriver,
  navigateTo,
  waitFor,
  fill,
  click,
  getSource,
  registerUser,
  BASE_URL,
  API_URL,
  By,
  until,
};

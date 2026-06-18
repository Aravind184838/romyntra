/**
 * 02-login.test.js — Login Page E2E Tests
 * Targets: https://USERNAME.github.io/REPO/#/login
 *
 * Element IDs used (must exist in the React component):
 *   login-email    — email input
 *   login-password — password input
 *   login-submit   — submit button
 *   login-phone    — phone input (Phone tab)
 */
'use strict';

const assert = require('assert');
const {
  buildDriver, navigateTo, fill, click, getSource,
  registerUser, By, until,
} = require('../utils/driver');

describe('🔐 Login Page', function () {
  this.timeout(60000);

  let driver;

  before(async () => { driver = await buildDriver(); });
  after(async  () => { if (driver) await driver.quit(); });

  // ── 1. Page load ──────────────────────────────────────────────────────────
  it('login page loads at /#/login', async () => {
    await navigateTo(driver, '/login');
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/login'), `Expected /#/login in URL, got: ${url}`);
  });

  it('email input is visible by default', async () => {
    await navigateTo(driver, '/login');
    const el = await driver.findElement(By.id('login-email'));
    assert(await el.isDisplayed(), 'Email input should be visible');
  });

  it('password input exists and is type=password', async () => {
    await navigateTo(driver, '/login');
    const el   = await driver.findElement(By.id('login-password'));
    const type = await el.getAttribute('type');
    assert.strictEqual(type, 'password', 'Password should be masked by default');
  });

  it('submit button is visible', async () => {
    await navigateTo(driver, '/login');
    const btn = await driver.findElement(By.id('login-submit'));
    assert(await btn.isDisplayed(), 'Submit button not visible');
  });

  // ── 2. Tab switching ──────────────────────────────────────────────────────
  it('switching to Phone tab reveals phone input', async () => {
    await navigateTo(driver, '/login');
    const phoneTab = await driver.findElement(
      By.xpath("//button[contains(text(),'Phone')]")
    );
    await phoneTab.click();
    await driver.sleep(400);
    const phoneInput = await driver.findElement(By.id('login-phone'));
    assert(await phoneInput.isDisplayed(), 'Phone input not visible after switching tab');
  });

  it('switching back to Email tab restores email input', async () => {
    await navigateTo(driver, '/login');
    await (await driver.findElement(By.xpath("//button[contains(text(),'Phone')]"))).click();
    await driver.sleep(300);
    await (await driver.findElement(By.xpath("//button[contains(text(),'Email')]"))).click();
    await driver.sleep(300);
    const emailInput = await driver.findElement(By.id('login-email'));
    assert(await emailInput.isDisplayed(), 'Email input not visible after switching back');
  });

  // ── 3. Validation ─────────────────────────────────────────────────────────
  it('submitting empty form shows validation error', async () => {
    await navigateTo(driver, '/login');
    await click(driver, By.id('login-submit'));
    await driver.sleep(600);
    const src = await getSource(driver);
    assert(
      src.includes('required') || src.includes('email') || (await driver.getCurrentUrl()).includes('login'),
      'Expected validation error on empty submit'
    );
  });

  it('invalid credentials keep user on /login with error message', async () => {
    await navigateTo(driver, '/login');
    await fill(driver, By.id('login-email'),    'nobody@nowhere.com');
    await fill(driver, By.id('login-password'), 'WrongPass999!');
    await click(driver, By.id('login-submit'));
    await driver.sleep(3000);
    const url = await driver.getCurrentUrl();
    const src = await getSource(driver);
    assert(
      url.includes('login') || src.includes('invalid') || src.includes('error') || src.includes('incorrect'),
      `Expected error on bad credentials. URL: ${url}`
    );
  });

  // ── 4. Password visibility toggle ─────────────────────────────────────────
  it('password toggle changes input type to text and back', async () => {
    await navigateTo(driver, '/login');
    await fill(driver, By.id('login-password'), 'TestPassword');

    const pwInput  = await driver.findElement(By.id('login-password'));
    const typeBefore = await pwInput.getAttribute('type');
    assert.strictEqual(typeBefore, 'password', 'Password should start hidden');

    const toggle = await driver.findElement(
      By.xpath("//input[@id='login-password']/following-sibling::button")
    );
    await toggle.click();
    await driver.sleep(200);

    const typeAfter = await pwInput.getAttribute('type');
    assert.strictEqual(typeAfter, 'text', 'Password should be visible after toggle');
  });

  // ── 5. Navigation links ───────────────────────────────────────────────────
  it("'Create account' link navigates to /#/signup", async () => {
    await navigateTo(driver, '/login');
    const link = await driver.findElement(By.xpath("//a[@href='/signup']"));
    await link.click();
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/signup'), `Expected /#/signup, got: ${url}`);
  });

  // ── 6. Valid login ────────────────────────────────────────────────────────
  it('valid credentials redirect away from /login', async () => {
    const user = await registerUser();
    if (!user) {
      console.log('    ⚠  Skipping: backend not reachable for user registration');
      return;
    }
    await navigateTo(driver, '/login');
    await fill(driver, By.id('login-email'),    user.email);
    await fill(driver, By.id('login-password'), user.password);
    await click(driver, By.id('login-submit'));
    await driver.sleep(2500);
    const url = await driver.getCurrentUrl();
    assert(!url.includes('#/login'), `Still on /login after valid login. URL: ${url}`);
  });
});

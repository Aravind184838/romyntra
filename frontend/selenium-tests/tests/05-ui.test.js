/**
 * 05-ui.test.js — UI Elements & Responsiveness E2E Tests
 * Verifies visual quality, element IDs, responsive viewports.
 */
'use strict';

const assert = require('assert');
const { buildDriver, navigateTo, getSource, By } = require('../utils/driver');

describe('🎨 UI Elements & Responsiveness', function () {
  this.timeout(30000);

  let driver;
  before(async () => { driver = await buildDriver(); });
  after(async  () => { if (driver) await driver.quit(); });

  // ── Splash ────────────────────────────────────────────────────────────────
  it('splash page contains Romyntra app name', async () => {
    await navigateTo(driver, '/');
    const src = await getSource(driver);
    assert(src.includes('romyntra'), 'Expected Romyntra app name on splash');
  });

  it('splash page contains heart/love icon or emoji', async () => {
    await navigateTo(driver, '/');
    const src = await (await driver.getPageSource());
    assert(
      src.includes('💘') || src.includes('❤') || src.toLowerCase().includes('heart'),
      'Expected heart/love icon on splash'
    );
  });

  // ── Login page ─────────────────────────────────────────────────────────────
  it('login page has Romyntra branding', async () => {
    await navigateTo(driver, '/login');
    const src = await getSource(driver);
    assert(src.includes('romyntra'), 'Expected Romyntra branding on login page');
  });

  it('login email input has placeholder text', async () => {
    await navigateTo(driver, '/login');
    const el = await driver.findElement(By.id('login-email'));
    const ph = await el.getAttribute('placeholder');
    assert(ph && ph.length > 0, 'Email input is missing placeholder text');
  });

  it('login password input is type=password', async () => {
    await navigateTo(driver, '/login');
    const el = await driver.findElement(By.id('login-password'));
    const t  = await el.getAttribute('type');
    assert.strictEqual(t, 'password', 'Password input should be type=password');
  });

  it("login submit button text contains 'sign' or 'login'", async () => {
    await navigateTo(driver, '/login');
    const btn  = await driver.findElement(By.id('login-submit'));
    const text = (await btn.getText()).toLowerCase();
    assert(
      text.includes('sign') || text.includes('login') || text.includes('enter'),
      `Submit button text unexpected: "${text}"`
    );
  });

  // ── Signup page ────────────────────────────────────────────────────────────
  it('signup page shows step indicator containing "Step 1"', async () => {
    await navigateTo(driver, '/signup');
    const src = await (await driver.getPageSource());
    assert(src.includes('Step 1'), 'Expected step indicator with "Step 1" text');
  });

  it('signup Next button is visible', async () => {
    await navigateTo(driver, '/signup');
    const btn = await driver.findElement(By.id('signup-next'));
    assert(await btn.isDisplayed(), 'Next button not visible on signup');
  });

  it('signup page heading contains Romyntra branding', async () => {
    await navigateTo(driver, '/signup');
    const src = await getSource(driver);
    assert(
      src.includes('romyntra') || src.includes('join'),
      'Expected Romyntra heading on signup page'
    );
  });

  // ── Page titles ─────────────────────────────────────────────────────────────
  it('login page title contains Romyntra', async () => {
    await navigateTo(driver, '/login');
    const title = await driver.getTitle();
    assert(title.includes('Romyntra'), `Login page title missing Romyntra. Got: "${title}"`);
  });

  it('signup page title contains Romyntra', async () => {
    await navigateTo(driver, '/signup');
    const title = await driver.getTitle();
    assert(title.includes('Romyntra'), `Signup page title missing Romyntra. Got: "${title}"`);
  });

  // ── Responsiveness ─────────────────────────────────────────────────────────
  it('login page renders correctly at mobile width (375px)', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await navigateTo(driver, '/login');
    await driver.sleep(400);
    const el = await driver.findElement(By.id('login-email'));
    assert(await el.isDisplayed(), 'Email input not visible on mobile (375px)');
    await driver.manage().window().setRect({ width: 1280, height: 900 }); // restore
  });

  it('login page renders correctly at tablet width (768px)', async () => {
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await navigateTo(driver, '/login');
    await driver.sleep(400);
    const el = await driver.findElement(By.id('login-email'));
    assert(await el.isDisplayed(), 'Email input not visible on tablet (768px)');
    await driver.manage().window().setRect({ width: 1280, height: 900 });
  });

  it('login page renders correctly at desktop width (1440px)', async () => {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    await navigateTo(driver, '/login');
    await driver.sleep(400);
    const el = await driver.findElement(By.id('login-email'));
    assert(await el.isDisplayed(), 'Email input not visible on desktop (1440px)');
    await driver.manage().window().setRect({ width: 1280, height: 900 });
  });

  // ── No broken images ────────────────────────────────────────────────────────
  it('no broken image src attributes on login page', async () => {
    await navigateTo(driver, '/login');
    const imgs = await driver.findElements(By.tagName('img'));
    for (const img of imgs) {
      const src = (await img.getAttribute('src')) || '';
      assert(src && !src.includes('undefined') && !src.endsWith('/'),
        `Broken image src detected: "${src}"`);
    }
  });
});

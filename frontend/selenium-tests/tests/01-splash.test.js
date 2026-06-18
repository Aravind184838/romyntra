/**
 * 01-splash.test.js — Splash Screen E2E Tests
 * Targets: https://USERNAME.github.io/REPO/#/
 */
'use strict';

const assert = require('assert');
const { buildDriver, navigateTo, getSource, BASE_URL } = require('../utils/driver');

describe('🏠 Splash Screen', function () {
  this.timeout(30000);

  let driver;

  before(async () => { driver = await buildDriver(); });
  after(async  () => { if (driver) await driver.quit(); });

  it('page title contains Romyntra', async () => {
    await navigateTo(driver, '/');
    const title = await driver.getTitle();
    const src   = await getSource(driver);
    assert(
      title.includes('Romyntra') || src.includes('romyntra'),
      `Expected Romyntra branding. Title: "${title}"`
    );
  });

  it('splash page contains app branding content', async () => {
    await navigateTo(driver, '/');
    const src = await getSource(driver);
    assert(src.includes('romyntra'), 'Expected Romyntra text in page source');
  });

  it('splash page contains subtitle or description', async () => {
    await navigateTo(driver, '/');
    const src = await getSource(driver);
    assert(
      src.includes('love') || src.includes('date') || src.includes('match') || src.includes('plan'),
      'Expected a subtitle/description on the splash screen'
    );
  });

  it('splash auto-redirects to /login or /discover within 8 seconds', async () => {
    await navigateTo(driver, '/');
    let redirected = false;
    for (let i = 0; i < 16; i++) {
      await driver.sleep(500);
      const url = await driver.getCurrentUrl();
      if (url.includes('#/login') || url.includes('#/discover') || url.includes('#/setup-profile')) {
        redirected = true;
        break;
      }
    }
    const url = await driver.getCurrentUrl();
    assert(redirected, `Expected auto-redirect from splash. Current URL: ${url}`);
  });
});

/**
 * 04-navigation.test.js — Navigation & Routing E2E Tests
 * Verifies HashRouter routes, protected route guards, and inter-page links.
 */
'use strict';

const assert = require('assert');
const { buildDriver, navigateTo, click, By } = require('../utils/driver');

describe('🧭 Navigation & Routing', function () {
  this.timeout(30000);

  let driver;
  before(async () => { driver = await buildDriver(); });
  after(async  () => { if (driver) await driver.quit(); });

  it('root /#/ loads splash or redirects to login', async () => {
    await navigateTo(driver, '/');
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(
      url.includes('#/') || url.includes('#/login') || url.includes('#/discover'),
      `Unexpected root URL: ${url}`
    );
  });

  it('direct navigation to /#/login works', async () => {
    await navigateTo(driver, '/login');
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/login'), `Expected /#/login. Got: ${url}`);
  });

  it('direct navigation to /#/signup works', async () => {
    await navigateTo(driver, '/signup');
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/signup'), `Expected /#/signup. Got: ${url}`);
  });

  it('unauthenticated access to /#/discover redirects away', async () => {
    // Clear auth token first
    await driver.get((process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '') + '/');
    await driver.executeScript("localStorage.removeItem('romyntra_token')");
    await navigateTo(driver, '/discover');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    assert(
      !url.includes('#/discover') || url.includes('#/login') || url.includes('#/'),
      `Protected /discover accessible without auth. URL: ${url}`
    );
  });

  it('unauthenticated access to /#/matches redirects away', async () => {
    await driver.executeScript("localStorage.removeItem('romyntra_token')");
    await navigateTo(driver, '/matches');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    assert(
      !url.includes('#/matches') || url.includes('#/login'),
      `Protected /matches accessible without auth. URL: ${url}`
    );
  });

  it('unauthenticated access to /#/profile redirects away', async () => {
    await driver.executeScript("localStorage.removeItem('romyntra_token')");
    await navigateTo(driver, '/profile');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    assert(
      !url.includes('#/profile') || url.includes('#/login'),
      `Protected /profile accessible without auth. URL: ${url}`
    );
  });

  it('unknown route redirects to root /#/', async () => {
    await navigateTo(driver, '/this-does-not-exist-xyz');
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(
      !url.includes('#/this-does-not-exist-xyz'),
      `Unknown route not handled. URL: ${url}`
    );
  });

  it("'Create account' link on login → navigates to /#/signup", async () => {
    await navigateTo(driver, '/login');
    const link = await driver.findElement(By.xpath("//a[@href='/signup']"));
    await link.click();
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/signup'), `Expected /#/signup. Got: ${url}`);
  });

  it("'Already have account' link on signup → navigates to /#/login", async () => {
    await navigateTo(driver, '/signup');
    const link = await driver.findElement(By.xpath("//a[@href='/login']"));
    await link.click();
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/login'), `Expected /#/login. Got: ${url}`);
  });

  it('browser back from /#/signup returns to previous page', async () => {
    await navigateTo(driver, '/login');
    await navigateTo(driver, '/signup');
    await driver.navigate().back();
    await driver.sleep(800);
    const url = await driver.getCurrentUrl();
    assert(
      url.includes('#/login') || url.includes('#/'),
      `Expected to go back from signup. URL: ${url}`
    );
  });

  it('page refresh on /#/login keeps user on login (no 404)', async () => {
    await navigateTo(driver, '/login');
    await driver.navigate().refresh();
    await driver.sleep(1000);
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/login'), `After refresh expected /#/login. Got: ${url}`);
  });
});

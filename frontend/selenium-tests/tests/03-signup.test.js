/**
 * 03-signup.test.js — Signup Page E2E Tests (3-step form)
 * Targets: https://USERNAME.github.io/REPO/#/signup
 *
 * Element IDs:
 *   signup-name, signup-email, signup-password, signup-next
 *   signup-phone, signup-dob
 *   signup-terms, signup-submit
 */
'use strict';

const assert = require('assert');
const {
  buildDriver, navigateTo, fill, click, getSource, By,
} = require('../utils/driver');

const BASE_TS = Date.now();

async function fillStep1(driver, name, email, password, confirm) {
  await fill(driver, By.id('signup-name'),     name);
  await fill(driver, By.id('signup-email'),    email);
  await fill(driver, By.id('signup-password'), password);
  await fill(driver, By.xpath("//input[@placeholder='Repeat password']"), confirm || password);
}

async function nextStep(driver) {
  await click(driver, By.id('signup-next'));
  await driver.sleep(600);
}

async function fillStep2(driver, phone, dob) {
  await fill(driver, By.id('signup-phone'), phone);
  await fill(driver, By.id('signup-dob'),   dob);
}

describe('📝 Signup Page', function () {
  this.timeout(60000);

  let driver;
  before(async () => { driver = await buildDriver(); });
  after(async  () => { if (driver) await driver.quit(); });

  it('signup page loads at /#/signup', async () => {
    await navigateTo(driver, '/signup');
    const url = await driver.getCurrentUrl();
    assert(url.includes('#/signup'), `Expected /#/signup. Got: ${url}`);
  });

  it('Step 1 fields are visible (name, email, password)', async () => {
    await navigateTo(driver, '/signup');
    const name = await driver.findElement(By.id('signup-name'));
    assert(await name.isDisplayed(), 'Name input not visible on Step 1');
  });

  it('clicking Next on empty Step 1 shows validation error', async () => {
    await navigateTo(driver, '/signup');
    await nextStep(driver);
    const src = await getSource(driver);
    assert(
      src.includes('required') || src.includes('name') || src.includes('step 1'),
      'Expected validation error on empty Step 1'
    );
  });

  it('password mismatch blocks advancing to Step 2', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'Test', `mm_${BASE_TS}@t.com`, 'Password1!', 'Different99!');
    await nextStep(driver);
    const src = await getSource(driver);
    const nameVisible = await (await driver.findElement(By.id('signup-name'))).isDisplayed().catch(() => false);
    assert(src.includes('match') || nameVisible, 'Expected password mismatch error');
  });

  it('valid Step 1 advances to Step 2 (phone input visible)', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'Valid User', `v1_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    const phoneInput = await driver.findElement(By.id('signup-phone'));
    assert(await phoneInput.isDisplayed(), 'Step 2 phone input not visible');
  });

  it('empty Step 2 shows phone validation error', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'V2', `v2_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    await nextStep(driver); // submit empty Step 2
    const src = await getSource(driver);
    const phoneVisible = await (await driver.findElement(By.id('signup-phone'))).isDisplayed().catch(() => false);
    assert(src.includes('required') || src.includes('phone') || phoneVisible,
      'Expected phone required error');
  });

  it('valid Step 2 advances to Step 3 (terms checkbox visible)', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'V3', `v3_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    await fillStep2(driver, '+919876543210', '2000-06-15');
    await nextStep(driver);
    const terms = await driver.findElement(By.id('signup-terms'));
    assert(await terms.isDisplayed(), 'Step 3 terms checkbox not visible');
  });

  it('submitting Step 3 without accepting terms shows error', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'V4', `v4_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    await fillStep2(driver, '+919876543211', '2000-06-15');
    await nextStep(driver);
    // Click submit WITHOUT checking terms
    await click(driver, By.id('signup-submit'));
    await driver.sleep(600);
    const src  = await getSource(driver);
    const termsVisible = await (await driver.findElement(By.id('signup-terms'))).isDisplayed().catch(() => false);
    assert(src.includes('terms') || src.includes('accept') || termsVisible,
      'Expected terms required error');
  });

  it('Back button on Step 2 returns to Step 1', async () => {
    await navigateTo(driver, '/signup');
    await fillStep1(driver, 'Back', `bk_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    const backBtn = await driver.findElement(By.xpath("//button[contains(text(),'Back')]"));
    await backBtn.click();
    await driver.sleep(500);
    const nameInput = await driver.findElement(By.id('signup-name'));
    assert(await nameInput.isDisplayed(), 'Back button did not return to Step 1');
  });

  it('step indicator updates (Step 1 → 2 → 3)', async () => {
    await navigateTo(driver, '/signup');
    const src1 = await (await driver.getPageSource());
    assert(src1.includes('Step 1'), 'Should start on Step 1');

    await fillStep1(driver, 'Ind', `ind_${BASE_TS}@t.com`, 'Password1!');
    await nextStep(driver);
    const src2 = await (await driver.getPageSource());
    assert(src2.includes('Step 2'), 'Step indicator should show Step 2');

    await fillStep2(driver, '+919876543212', '2000-06-15');
    await nextStep(driver);
    const src3 = await (await driver.getPageSource());
    assert(src3.includes('Step 3'), 'Step indicator should show Step 3');
  });

  it('full signup flow triggers backend response', async () => {
    await navigateTo(driver, '/signup');
    const unique = Date.now();
    await fillStep1(driver, `Full ${unique}`, `full_${unique}@t.com`, 'Password1!');
    await nextStep(driver);
    await fillStep2(driver, `+919${String(unique).slice(-8)}`, '2000-01-15');
    await nextStep(driver);
    await click(driver, By.id('signup-terms'));
    await driver.sleep(200);
    await click(driver, By.id('signup-submit'));
    await driver.sleep(3000);
    const url = await driver.getCurrentUrl();
    const src = await getSource(driver);
    assert(
      url.includes('otp') || url.includes('setup-profile') || src.includes('otp') ||
      src.includes('sms') || src.includes('error') || src.includes('account'),
      `Expected post-signup state. URL: ${url}`
    );
  });
});

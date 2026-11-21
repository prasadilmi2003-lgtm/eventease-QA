const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const LoginPage = require('../pages/LoginPage');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5180';

describe('Login page', function () {
  let driver;
  let loginPage;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    loginPage = new LoginPage(driver, BASE_URL);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  beforeEach(async function () {
    await loginPage.open();
  });

  it('opens the login page and shows the login form', async function () {
    const title = await driver.getTitle();
    assert.ok(title.length > 0);
    assert.ok(await loginPage.isDisplayed());
  });

  it('logs in successfully with valid demo credentials', async function () {
    await loginPage.login('attendee@demo.com', 'Demo@1234');
    await loginPage.waitForNavigationAway();

    const path = new URL(await driver.getCurrentUrl()).pathname;
    assert.strictEqual(path, '/attendee');
  });

  it('shows an error with incorrect credentials', async function () {
    await loginPage.login('attendee@demo.com', 'WrongPassword1');

    const text = await loginPage.getErrorText();
    assert.ok(/incorrect|invalid/i.test(text), `expected an error message, got "${text}"`);

    const url = await driver.getCurrentUrl();
    assert.ok(url.includes('/login'), 'expected to remain on /login after a failed login');
  });
});
const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");
const LoginPage = require("../pages/LoginPage");

const BASE_URL = process.env.BASE_URL || "http://localhost:5180";

describe("Access control", function () {
  let driver;
  let loginPage;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--headless=new");
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
    loginPage = new LoginPage(driver, BASE_URL);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // Test that a guest user is redirected to the login page when trying to access a protected route
  it("redirects a guest from /attendee to /login", async function () {
    await loginPage.clearSession();
    await driver.get(`${BASE_URL}/attendee`);
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes("/login"),
      10000,
    );
    const url = await driver.getCurrentUrl();
    assert.ok(
      url.includes("/login"),
      `expected redirect to /login, got ${url}`,
    );
  });

  // Test that an attendee user is redirected to the attendee dashboard when trying to access the organizer route
  it("sends an attendee back to /attendee when opening /organizer", async function () {
    await loginPage.open();
    await loginPage.login("attendee@demo.com", "Demo@1234");
    await loginPage.waitForNavigationAway();

    await driver.get(`${BASE_URL}/organizer`);
    await driver.wait(
      async () =>
        new URL(await driver.getCurrentUrl()).pathname === "/attendee",
      10000,
    );
    const path = new URL(await driver.getCurrentUrl()).pathname;
    assert.strictEqual(path, "/attendee");
  });

    // Test that an organizer is redirected to the organizer dashboard when trying to access the attendee route
  it("sends an organizer back to /organizer when opening /attendee", async function () {
    await loginPage.open();
    await loginPage.login("organizer@demo.com", "Demo@1234");
    await loginPage.waitForNavigationAway();

    await driver.get(`${BASE_URL}/attendee`);
    await driver.wait(
      async () =>
        new URL(await driver.getCurrentUrl()).pathname === "/organizer",
      10000,
    );
    const path = new URL(await driver.getCurrentUrl()).pathname;
    assert.strictEqual(path, "/organizer");
  });
});

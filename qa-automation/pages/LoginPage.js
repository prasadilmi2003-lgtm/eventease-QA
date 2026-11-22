const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver, baseUrl) {
    this.driver = driver;
    this.baseUrl = baseUrl;
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
    this.errorAlert = By.css('[role="alert"]');
  }

  async clearSession() {
    await this.driver.manage().deleteAllCookies();
  }

  async open() {
    await this.clearSession();
    await this.driver.get(`${this.baseUrl}/login`);
    await this.driver.wait(until.elementLocated(this.emailInput), 10000);
  }

  async login(email, password) {
    await this.driver.findElement(this.emailInput).sendKeys(email);
    await this.driver.findElement(this.passwordInput).sendKeys(password);
    await this.driver.findElement(this.submitButton).click();
  }

  async waitForNavigationAway() {
    await this.driver.wait(async () => !(await this.driver.getCurrentUrl()).includes('/login'), 10000);
  }

  async getErrorText() {
    const alert = await this.driver.wait(until.elementLocated(this.errorAlert), 10000);
    return alert.getText();
  }

  async isDisplayed() {
    const email = await this.driver.findElement(this.emailInput);
    const password = await this.driver.findElement(this.passwordInput);
    return (await email.isDisplayed()) && (await password.isDisplayed());
  }
}

module.exports = LoginPage;
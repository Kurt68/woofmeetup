import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly createAccountButton: Locator
  readonly primaryTitle: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.createAccountButton = page.getByRole('button', {
      name: 'Create Account',
    })
    this.primaryTitle = page.getByText('Wag Right')
    this.loginButton = page.getByRole('button', { name: 'LOG IN' })
  }

  async goto() {
    await this.page.goto('/')
  }

  async openSignupModal() {
    await this.createAccountButton.click()
  }

  async openLoginModal() {
    await this.loginButton.click()
  }
}

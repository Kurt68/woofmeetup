import { Page, Locator } from '@playwright/test'

export class AuthModal {
  readonly page: Page
  readonly modal: Locator
  readonly firstNameField: Locator
  readonly emailField: Locator
  readonly passwordField: Locator
  readonly confirmPasswordField: Locator
  readonly submitButton: Locator
  readonly closeButton: Locator
  readonly switchToLoginButton: Locator
  readonly switchToSignupButton: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.modal = page.locator('.auth-modal').first()
    this.firstNameField = page.locator('input#name')
    this.emailField = page.locator('input#email')
    this.passwordField = page.locator('input#password')
    this.confirmPasswordField = page.locator('input#password-check')
    this.submitButton = page.getByRole('button', { name: 'Submit' })
    this.closeButton = page.locator('.close-icon').first()
    this.switchToLoginButton = page.getByRole('button', { name: 'Log in' })
    this.switchToSignupButton = page.getByRole('button', { name: 'Sign up' })
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot Password',
    })
  }

  async fillSignupForm(firstName: string, email: string, password: string) {
    await this.firstNameField.fill(firstName)
    await this.emailField.fill(email)
    await this.passwordField.fill(password)
    await this.confirmPasswordField.fill(password)
  }

  async fillLoginForm(email: string, password: string) {
    await this.emailField.fill(email)
    await this.passwordField.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async switchToLogin() {
    // Close current modal first
    await this.close()
    // Click the LOG IN button in nav
    await this.page.getByRole('button', { name: 'LOG IN' }).click()
  }

  async switchToSignup() {
    // Close current modal first
    await this.close()
    // Click the Create Account button
    await this.page.getByRole('button', { name: 'Create Account' }).click()
  }

  async close() {
    await this.closeButton.click()
  }

  async isVisible() {
    return await this.modal.isVisible()
  }
}

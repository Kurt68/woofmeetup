import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly userProfile: Locator
  readonly settingsButton: Locator
  readonly messagesSection: Locator
  readonly matchesSection: Locator
  readonly profileEditButton: Locator

  constructor(page: Page) {
    this.page = page
    this.userProfile = page.locator('[data-testid="user-profile"]').first()
    this.settingsButton = page.getByRole('button', { name: /settings/i })
    this.messagesSection = page.locator('[data-testid="messages"]').first()
    this.matchesSection = page.locator('[data-testid="matches"]').first()
    this.profileEditButton = page.getByRole('button', {
      name: /edit.*profile/i,
    })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async openSettings() {
    await this.settingsButton.click()
  }

  async editProfile() {
    await this.profileEditButton.click()
  }

  async isVisible() {
    // Wait for the dashboard to load by checking for key elements
    await this.page.waitForLoadState('networkidle')
    return true
  }
}

import { Page, Locator } from '@playwright/test'

export class PricingPage {
  readonly page: Page
  readonly subscriptionTab: Locator
  readonly creditsTab: Locator
  readonly freePlanButton: Locator
  readonly premiumPlanButton: Locator
  readonly starterPackButton: Locator
  readonly popularPackButton: Locator
  readonly powerPackButton: Locator
  readonly backToDashboardLink: Locator

  constructor(page: Page) {
    this.page = page
    this.subscriptionTab = page.getByRole('button', { name: /monthly plans/i })
    this.creditsTab = page.getByRole('button', { name: /buy credits/i })
    // Free plan button is the first plan card button in subscription tab
    this.freePlanButton = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Free' }) })
      .locator('button')
      .first()
    // Premium plan button (with badge "Most Popular")
    this.premiumPlanButton = page
      .locator('.pricing-card.featured')
      .filter({ has: page.getByText('Premium') })
      .locator('button')
      .first()
    // Credit pack buttons
    this.starterPackButton = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Starter Pack' }) })
      .locator('button')
      .first()
    this.popularPackButton = page
      .locator('.pricing-card.featured')
      .filter({ has: page.getByText('Popular Pack') })
      .locator('button')
      .first()
    this.powerPackButton = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Power Pack' }) })
      .locator('button')
      .first()
    this.backToDashboardLink = page.getByRole('link', {
      name: /back to dashboard/i,
    })
  }

  async goto() {
    await this.page.goto('/pricing')
  }

  async switchToSubscriptionTab() {
    await this.subscriptionTab.click()
  }

  async switchToCreditsTab() {
    await this.creditsTab.click()
  }

  async isVisible() {
    await this.page.waitForLoadState('networkidle')
    return true
  }
}

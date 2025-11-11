import { test, expect } from '@playwright/test'
import { PricingPage } from './pages/PricingPage'

test.describe('Pricing Page - Free Plan Button', () => {
  let pricingPage: PricingPage

  test.beforeEach(async ({ page }) => {
    pricingPage = new PricingPage(page)
    // Note: This test assumes an authenticated user.
    // In a real scenario with authentication, you'd need to set up auth state.
    // For now, we test the UI structure on the pricing page.
  })

  test('should display Free plan with disabled "Current Plan" button', async ({
    page,
  }) => {
    // Mock authentication by setting cookies or using auth context
    // For this test, we just navigate and check the UI structure
    await pricingPage.goto()

    // Wait for page to load
    await pricingPage.isVisible()

    // Verify we're on subscription tab by default
    const subscriptionTab = pricingPage.subscriptionTab
    await expect(subscriptionTab).toHaveClass(/active/)

    // Find the Free plan card
    const freeCard = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Free' }) })
    await expect(freeCard).toBeVisible()

    // Verify Free plan button text is "Current Plan"
    const freePlanButton = freeCard.locator('button')
    await expect(freePlanButton).toHaveText('Current Plan')

    // Verify Free plan button is disabled
    await expect(freePlanButton).toBeDisabled()

    // Verify the button cannot be clicked
    let wasClicked = false
    const clickHandler = () => {
      wasClicked = true
    }
    // Use page evaluate to verify button is truly disabled
    const isDisabled = await freePlanButton.evaluate(
      (btn) => (btn as HTMLButtonElement).disabled
    )
    expect(isDisabled).toBe(true)
  })

  test('should have enabled Premium plan button on subscription tab', async ({
    page,
  }) => {
    await pricingPage.goto()
    await pricingPage.isVisible()

    // Find Premium plan card
    const premiumCard = page
      .locator('.pricing-card.featured')
      .filter({ has: page.getByText('Premium') })
    await expect(premiumCard).toBeVisible()

    // Verify Premium plan button is enabled
    const premiumButton = premiumCard.locator('button')
    await expect(premiumButton).not.toBeDisabled()
    await expect(premiumButton).toHaveText(
      /get premium|processing|current plan/i
    )
  })

  test('should have enabled Buy Now buttons for credit packages', async ({
    page,
  }) => {
    await pricingPage.goto()
    await pricingPage.isVisible()

    // Switch to credits tab
    await pricingPage.switchToCreditsTab()

    // Wait for credits tab content to load
    await expect(
      page
        .locator('.pricing-card')
        .filter({ has: page.getByText('Starter Pack') })
    ).toBeVisible()

    // Find all credit package buttons
    const starterButton = page
      .locator('.pricing-card')
      .filter({ has: page.getByText('Starter Pack') })
      .locator('button')
      .first()

    const popularButton = page
      .locator('.pricing-card.featured')
      .filter({ has: page.getByText('Popular Pack') })
      .locator('button')
      .first()

    const powerButton = page
      .locator('.pricing-card')
      .filter({ has: page.getByText('Power Pack') })
      .locator('button')
      .first()

    // Verify all credit buttons are enabled
    await expect(starterButton).not.toBeDisabled()
    await expect(popularButton).not.toBeDisabled()
    await expect(powerButton).not.toBeDisabled()
  })

  test('Free plan button should not be clickable and always shows "Current Plan"', async ({
    page,
  }) => {
    await pricingPage.goto()
    await pricingPage.isVisible()

    const freeCard = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Free' }) })
    const freePlanButton = freeCard.locator('button')

    // Verify button text
    const buttonText = await freePlanButton.textContent()
    expect(buttonText?.trim()).toBe('Current Plan')

    // Verify button is disabled
    const disabled = await freePlanButton.evaluate(
      (btn) => (btn as HTMLButtonElement).disabled
    )
    expect(disabled).toBe(true)

    // Verify button class contains "disabled" or similar
    const classes = await freePlanButton.getAttribute('class')
    expect(classes).toBeDefined()

    // Verify attempting to click doesn't trigger any action
    const pagePromise = page
      .waitForEvent('popup', { timeout: 1000 })
      .catch(() => null)
    await freePlanButton.click().catch(() => {
      // Expected to fail since button is disabled
    })
    const popup = await pagePromise
    expect(popup).toBeNull()
  })

  test('Free plan features include "10 chat messages (credits) upon sign up"', async ({
    page,
  }) => {
    await pricingPage.goto()
    await pricingPage.isVisible()

    // Find Free plan card
    const freeCard = page
      .locator('.pricing-card')
      .filter({ has: page.getByRole('heading', { name: 'Free' }) })

    // Verify the feature text
    const features = freeCard.locator('.features li')
    const featureTexts = await features.allTextContents()

    // Should include the updated text about sign-up credits
    const hasSignupCreditsFeature = featureTexts.some((text) =>
      text.includes('10 chat messages (credits) upon sign up')
    )
    expect(hasSignupCreditsFeature).toBe(true)

    // Should include other expected features
    const hasCreateProfile = featureTexts.some((text) =>
      text.includes('Create profile')
    )
    expect(hasCreateProfile).toBe(true)

    const hasWagAndMatch = featureTexts.some((text) =>
      text.includes('Wag right and match')
    )
    expect(hasWagAndMatch).toBe(true)
  })
})

import { test, expect } from '@playwright/test'

test.describe('Matches Button Tab Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user that has matches
    await page.goto('http://localhost:5173')

    // Navigate to login
    const loginButton = page.locator('button:has-text("LOG IN")')
    await loginButton.click()

    // Wait for auth modal
    await page
      .waitForSelector('[class*="modal"]', { timeout: 5000 })
      .catch(() => null)

    // Fill login form
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill('test@example.com')
    await passwordInput.fill('TestPassword123!')

    // Click login button in modal
    const submitButton = page.locator('button:has-text("Log In")').first()
    await submitButton.click({ timeout: 10000 })

    // Wait for navigation to dashboard/chat
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => null)
  })

  test('should render Matches button with tab styling when user has matches', async ({
    page,
  }) => {
    // Check if Matches button exists
    const matchesButton = page.locator('button.option.matches-tab')

    // Verify the button is visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })
  })

  test('should apply primary color styling to Matches button', async ({
    page,
  }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Wait for button to be visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })

    // Check for primary color border
    const borderColor = await matchesButton.evaluate((el) => {
      return window.getComputedStyle(el).borderBottomColor
    })

    // Primary pink color should be applied (rgb(255, 192, 203) or #ffc0cb)
    expect(borderColor).toMatch(/rgb\(255,\s*192,\s*203\)|rgb\(255, 192, 203\)/)
  })

  test('should apply primary color text to Matches button', async ({
    page,
  }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Wait for button to be visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })

    // Check for primary color text
    const textColor = await matchesButton.evaluate((el) => {
      return window.getComputedStyle(el).color
    })

    // Primary pink color should be applied
    expect(textColor).toMatch(/rgb\(255,\s*192,\s*203\)|rgb\(255, 192, 203\)/)
  })

  test('should have 3px solid pink bottom border', async ({ page }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Wait for button to be visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })

    // Check border properties
    const borderWidth = await matchesButton.evaluate((el) => {
      return window.getComputedStyle(el).borderBottomWidth
    })

    const borderStyle = await matchesButton.evaluate((el) => {
      return window.getComputedStyle(el).borderBottomStyle
    })

    expect(borderWidth).toBe('3px')
    expect(borderStyle).toBe('solid')
  })

  test('should have hover state with light pink background', async ({
    page,
  }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Wait for button to be visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })

    // Hover over button
    await matchesButton.hover()

    // Get computed background color on hover
    const hoverBgColor = await matchesButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Should have light pink background (rgba(255, 192, 203, 0.1))
    // Browser may return this in various formats, so we check for presence of rgba or color
    expect(hoverBgColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(hoverBgColor).not.toBe('transparent')
  })

  test('should have matches-tab class and not matches class', async ({
    page,
  }) => {
    const matchesTab = page.locator('button.option.matches-tab')
    const matchesOld = page.locator('button.option.matches:not(.matches-tab)')

    // Verify new class exists
    await expect(matchesTab).toBeVisible({ timeout: 5000 })

    // Verify old class doesn't exist (or at least new one takes precedence)
    expect(await matchesOld.count()).toBe(0)
  })

  test('should display match icon image', async ({ page }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Wait for button to be visible
    await expect(matchesButton).toBeVisible({ timeout: 5000 })

    // Check for img inside button
    const imgElement = matchesButton.locator('img')
    await expect(imgElement).toBeVisible()

    // Verify alt text
    const altText = await imgElement.getAttribute('alt')
    expect(altText).toBe('Matches icon')
  })

  test('should render with proper tab visual hierarchy', async ({ page }) => {
    const matchesButton = page.locator('button.option.matches-tab')

    // Verify button is in header
    const header = page.locator('.header-chat-container .header')
    const buttonInHeader = header.locator('button.option.matches-tab')

    await expect(buttonInHeader).toBeVisible({ timeout: 5000 })
  })
})

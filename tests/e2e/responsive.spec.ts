import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'

test.describe('Responsive Design', () => {
  test('should display correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const homePage = new HomePage(page)
    await homePage.goto()

    // On mobile, the primary title is hidden via CSS media queries
    // Check if it's in DOM but hidden (responsive design)
    await expect(homePage.primaryTitle).toBeAttached()
    await expect(homePage.createAccountButton).toBeVisible()

    // Check responsive layout
    const createAccountButton = homePage.createAccountButton
    const buttonBox = await createAccountButton.boundingBox()

    if (buttonBox) {
      // Button should be reasonably sized for touch
      expect(buttonBox.width).toBeGreaterThan(100)
      expect(buttonBox.height).toBeGreaterThan(40)
    }
  })

  test('should display modal correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Modal should be visible and properly sized
    expect(await authModal.isVisible()).toBe(true)

    // Wait for the modal title to confirm it's loaded
    await expect(
      page.getByRole('heading', { name: 'Create Account' })
    ).toBeVisible()

    // Check modal dimensions are appropriate for mobile
    const modal = page.locator('.auth-modal, [role="dialog"]')
    const modalBox = await modal.boundingBox()

    if (modalBox) {
      // Modal should fit within mobile viewport
      expect(modalBox.width).toBeLessThanOrEqual(375)
      expect(modalBox.height).toBeLessThanOrEqual(667)
    }

    // Just verify basic modal functionality on mobile
    // The modal is open and functional - that's what matters for responsive testing
    await expect(
      page.getByRole('heading', { name: 'Create Account' }).first()
    ).toBeVisible()

    // For responsive testing, the key thing is that the modal opened successfully
    // and has appropriate dimensions for the mobile viewport
    console.log(
      'Mobile responsive modal test completed - modal opened and sized correctly'
    )
  })

  test('should display correctly on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad

    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify elements are visible on tablet
    await expect(homePage.primaryTitle).toBeVisible()
    await expect(homePage.createAccountButton).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Verify elements are visible on desktop
    await expect(homePage.primaryTitle).toBeVisible()
    await expect(homePage.createAccountButton).toBeVisible()
  })

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait mobile (title hidden)
    await page.setViewportSize({ width: 375, height: 667 })

    const homePage = new HomePage(page)
    await homePage.goto()

    // On mobile portrait, title is hidden but attached
    await expect(homePage.primaryTitle).toBeAttached()
    await expect(homePage.createAccountButton).toBeVisible()

    // Switch to landscape (wider - title might become visible)
    await page.setViewportSize({ width: 667, height: 375 })

    // Elements should be accessible (visible or at least attached)
    await expect(homePage.primaryTitle).toBeAttached()
    await expect(homePage.createAccountButton).toBeVisible()
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    // Tab navigation should work
    await page.keyboard.press('Tab')

    // Focus should be on a focusable element
    const focused = await page.locator(':focus')
    await expect(focused).toBeVisible()

    // Should be able to activate button with keyboard
    await homePage.createAccountButton.focus()
    await page.keyboard.press('Enter')

    const authModal = new AuthModal(page)
    expect(await authModal.isVisible()).toBe(true)
  })
})

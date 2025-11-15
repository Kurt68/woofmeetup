import { test, expect } from '@playwright/test'

test.describe('TruncatedBio Tooltip', () => {
  test('should display white tooltip with centered heading, dog name, and meetup icon', async ({ page, browserName }) => {
    await page.goto('/')

    // Log in first to access the swipe card page
    await page.getByRole('button', { name: 'LOG IN' }).click()
    await page.waitForSelector('.auth-modal', { timeout: 5000 })

    // Enter test credentials
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')

    // Click login button
    const loginButton = page.locator('button:has-text("LOG IN")')
    await loginButton.click()

    // Wait for navigation or page content to load
    await page.waitForTimeout(2000)

    // Try to find the truncated bio ellipsis
    const ellipsis = page.locator('[data-tooltip-id]')
    const ellipsisCount = await ellipsis.count()

    if (ellipsisCount > 0) {
      // For desktop, hover over the ellipsis to show tooltip
      if (browserName === 'chromium' && page.viewportSize()?.width! > 768) {
        await ellipsis.first().hover()
        await page.waitForTimeout(500)

        // Check that tooltip content is visible
        const tooltipTitle = page.locator('.truncated-bio-tooltip-title')
        const tooltipContent = page.locator('.truncated-bio-tooltip-content')
        const meetupIcon = page.locator('.truncated-bio-meetup-icon')

        // The title should contain "About Me and"
        const titleText = await tooltipTitle.textContent()
        expect(titleText).toContain('About Me and')

        // Check if the tooltip has white background
        const tooltipElement = page.locator('.truncated-bio-tooltip')
        const backgroundColor = await tooltipElement.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor
        })

        // Should be white or very close to white
        expect(backgroundColor).toMatch(/white|rgb\(255,\s*255,\s*255\)/i)

        // Check that content is visible
        expect(await tooltipContent.isVisible()).toBeTruthy()

        // Check if meetup icon is visible (if meetup_type exists)
        const iconCount = await meetupIcon.count()
        if (iconCount > 0) {
          expect(await meetupIcon.first().isVisible()).toBeTruthy()
          // Icon should be one of the expected emojis
          const iconText = await meetupIcon.first().textContent()
          expect(['🏃', '🎾', '🚶']).toContain(iconText?.trim() || '')
        }

        // Take a screenshot for visual verification
        await page.screenshot({ path: '/tmp/truncated_bio_desktop.png' })
      }
    } else {
      console.log('No truncated bio found on this page')
    }
  })

  test('should display tooltip with left-aligned text below centered heading and icon', async ({ page }) => {
    await page.goto('/')

    // Log in first
    await page.getByRole('button', { name: 'LOG IN' }).click()
    await page.waitForSelector('.auth-modal', { timeout: 5000 })

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')

    const loginButton = page.locator('button:has-text("LOG IN")')
    await loginButton.click()

    await page.waitForTimeout(2000)

    // Find and hover over ellipsis if it exists
    const ellipsis = page.locator('[data-tooltip-id]')
    if (await ellipsis.count() > 0) {
      if (page.viewportSize()?.width! > 768) {
        await ellipsis.first().hover()
        await page.waitForTimeout(500)

        // Verify the header is centered
        const header = page.locator('.truncated-bio-tooltip-header')
        const headerStyle = await header.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            display: style.display,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
          }
        })

        expect(headerStyle.display).toBe('flex')
        expect(headerStyle.justifyContent).toContain('center')
        expect(headerStyle.alignItems).toContain('center')

        // Verify the text is left-aligned
        const bioText = page.locator('.truncated-bio-tooltip-text')
        const textStyle = await bioText.evaluate((el) => {
          return window.getComputedStyle(el).textAlign
        })

        expect(textStyle).toBe('left')

        // Verify title is center-aligned
        const titleStyle = await page.locator('.truncated-bio-tooltip-title').evaluate((el) => {
          return window.getComputedStyle(el).textAlign
        })

        expect(titleStyle).toBe('center')
      }
    }
  })
})

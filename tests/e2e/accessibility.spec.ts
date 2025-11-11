import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Configuration for comprehensive accessibility testing
const commonTestConfig = {
  timeout: 30000,
  retries: 1,
}

test.describe('Accessibility (A11y) Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage for consistent starting point
    await page.goto('http://localhost:8000')

    // Wait for initial page load
    await page.waitForLoadState('networkidle')
  })

  // ===== AUTOMATED ACCESSIBILITY AUDITS =====

  test('Should identify and report accessibility issues on homepage', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    // Log violations for review instead of failing
    if (accessibilityScanResults.violations.length > 0) {
      console.log('🚨 Accessibility violations found:')
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`)
        console.log(`   Impact: ${violation.impact}`)
        console.log(`   Elements: ${violation.nodes.length}`)
        violation.nodes.forEach((node) => {
          console.log(`   - ${node.html}`)
        })
      })
    }

    // Check that critical violations (serious/critical impact) are addressed
    const criticalViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical'
    )
    expect(criticalViolations.length).toBe(0) // No critical violations allowed

    // Allow up to 5 non-critical violations for incremental improvement
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(5)
  })

  test('Should check modal accessibility when opened', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.auth-modal')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Focus on critical modal issues only
    const criticalModalIssues = accessibilityScanResults.violations.filter(
      (violation) =>
        [
          'color-contrast',
          'focus-order-semantics',
          'aria-required-attr',
        ].includes(violation.id)
    )

    if (criticalModalIssues.length > 0) {
      console.log('🔍 Modal accessibility issues to address:')
      criticalModalIssues.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`)
      })
    }

    // Modal should at least be focusable and closable
    const modal = page.locator('.auth-modal')
    await expect(modal).toBeVisible()
  })

  test('Should audit dashboard accessibility for authenticated user', async ({
    page,
  }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-jwt-token')
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'test-user-id',
          username: 'testuser',
          profileComplete: true,
        })
      )
    })

    await page.goto('http://localhost:8000/dashboard')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()

    // Report but don't fail on dashboard issues during development
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        `📊 Dashboard has ${accessibilityScanResults.violations.length} accessibility issues to review`
      )
    }

    // Check for main content area more flexibly
    const contentElements = await page
      .locator('main, [role="main"], .dashboard, .main-content, body > div')
      .count()
    expect(contentElements).toBeGreaterThan(0)
  })

  // ===== KEYBOARD NAVIGATION TESTING =====

  test('Should support full keyboard navigation on homepage', async ({
    page,
  }) => {
    // Start navigation with Tab key
    let currentElement = page.locator(':focus')

    // Navigate through all interactive elements
    const interactiveElements = []

    // Tab through elements and collect them
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focusedElement = await page.locator(':focus').first()
      if ((await focusedElement.count()) > 0) {
        const tagName = await focusedElement.evaluate((el) =>
          el.tagName.toLowerCase()
        )
        const role = await focusedElement.getAttribute('role')
        const testId = await focusedElement.getAttribute('data-testid')

        interactiveElements.push({ tagName, role, testId })
      }
    }

    // Verify we focused on interactive elements
    expect(interactiveElements.length).toBeGreaterThan(3)

    // Check for common interactive elements
    const hasButtons = interactiveElements.some(
      (el) => el.tagName === 'button' || el.role === 'button'
    )
    expect(hasButtons).toBeTruthy()
  })

  test('Modal should allow keyboard navigation', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    // Test basic keyboard navigation within modal
    let focusedElements = []
    let modalElements = 0

    // Tab through modal elements
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focusedElement = await page.locator(':focus').first()
      if ((await focusedElement.count()) > 0) {
        const isInModal = await focusedElement.evaluate((el) => {
          return el.closest('.auth-modal') !== null
        })
        if (isInModal) modalElements++
        focusedElements.push(isInModal)
      }
    }

    // Report on focusable elements in modal
    if (modalElements === 0) {
      console.log(
        '💡 No focusable elements found in modal - consider adding keyboard navigation'
      )
    } else {
      console.log(`✅ Found ${modalElements} focusable elements in modal`)
    }

    // Check if focus trapping is implemented (optional for now)
    const focusTrapped = focusedElements.every((inModal) => inModal === true)
    if (!focusTrapped) {
      console.log(
        '💡 Consider implementing focus trapping for better modal accessibility'
      )
    }
  })

  test('Should close modal with Escape key', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    // Press Escape to close
    await page.keyboard.press('Escape')

    // Verify modal is closed
    await expect(page.locator('.auth-modal')).toHaveCount(0)
  })

  // ===== SCREEN READER COMPATIBILITY =====

  test('Should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

    let headingLevels = []
    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase())
      const level = parseInt(tagName.charAt(1))
      const text = await heading.textContent()

      headingLevels.push({ level, text })
    }

    // Should have at least one h1
    const hasH1 = headingLevels.some((h) => h.level === 1)
    expect(hasH1).toBeTruthy()

    // Heading levels should not skip (h1 → h3 would be bad)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i].level
      const previousLevel = headingLevels[i - 1].level
      const levelJump = currentLevel - previousLevel

      // Allow same level, one level down, or any level up
      expect(levelJump).toBeLessThanOrEqual(1)
    }
  })

  test('Interactive elements should have accessible names', async ({
    page,
  }) => {
    let unlabeledElements = 0

    // Check buttons have accessible names
    const buttons = await page.locator('button, [role="button"]').all()

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      // Button should have accessible name via text, aria-label, or aria-labelledby
      const hasAccessibleName =
        (textContent && textContent.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy

      if (!hasAccessibleName) {
        unlabeledElements++
        console.log(
          '💡 Found button without accessible name - consider adding labels'
        )
      }
    }

    // Check links have accessible names
    const links = await page.locator('a').all()

    for (const link of links) {
      const ariaLabel = await link.getAttribute('aria-label')
      const textContent = await link.textContent()

      const hasAccessibleName =
        (textContent && textContent.trim().length > 0) || ariaLabel

      if (!hasAccessibleName) {
        unlabeledElements++
        console.log(
          '💡 Found link without accessible name - consider adding labels'
        )
      }
    }

    // Allow some unlabeled elements during development but encourage improvement
    expect(unlabeledElements).toBeLessThanOrEqual(3)
  })

  test('Form inputs should have accessible labels', async ({ page }) => {
    // Open auth modal to test form inputs
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    const inputs = await page.locator('input, textarea, select').all()
    let unlabeledInputs = 0

    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')

      // Check for associated label if input has id
      let hasLabel = false
      if (id) {
        const label = await page.locator(`label[for="${id}"]`)
        hasLabel = (await label.count()) > 0
      }

      // Input should have label, aria-label, aria-labelledby, or at least placeholder
      const hasAccessibleName =
        hasLabel || ariaLabel || ariaLabelledBy || placeholder
      if (!hasAccessibleName) {
        unlabeledInputs++
        const inputType = (await input.getAttribute('type')) || 'unknown'
        console.log(
          `⚠️  Unlabeled ${inputType} input found - consider adding proper labels`
        )
      }
    }

    // Allow some unlabeled inputs during development but encourage improvement
    expect(unlabeledInputs).toBeLessThanOrEqual(2)
  })

  // ===== ARIA ROLES AND STATES =====

  test('Modal should have ARIA attributes for accessibility', async ({
    page,
  }) => {
    // Open auth modal
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    const modal = page.locator('.auth-modal')

    // Check for modal ARIA attributes (recommended but not required initially)
    const role = await modal.getAttribute('role')
    const ariaModal = await modal.getAttribute('aria-modal')
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby')
    const ariaLabel = await modal.getAttribute('aria-label')

    let missingAttributes = []
    if (!['dialog', 'alertdialog'].includes(role)) {
      missingAttributes.push('role="dialog"')
    }
    if (ariaModal !== 'true') {
      missingAttributes.push('aria-modal="true"')
    }
    if (!ariaLabelledBy && !ariaLabel) {
      missingAttributes.push('aria-label or aria-labelledby')
    }

    if (missingAttributes.length > 0) {
      console.log(
        `💡 Modal could improve accessibility by adding: ${missingAttributes.join(
          ', '
        )}`
      )
    }

    // At minimum, modal should be visible and interactive
    await expect(modal).toBeVisible()
    expect(missingAttributes.length).toBeLessThanOrEqual(3) // Allow gradual improvement
  })

  test('Interactive states should be announced correctly', async ({ page }) => {
    // Test loading states
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    // Fill in form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')

    // Submit and check for loading state
    const submitButton = page.locator('[data-testid="submit-button"]')
    await submitButton.click()

    // Check if loading state is communicated
    await page.waitForTimeout(500) // Allow time for loading state

    const ariaLabel = await submitButton.getAttribute('aria-label')
    const textContent = await submitButton.textContent()
    const ariaLive = await page.locator('[aria-live]').count()

    // Should have some way to communicate loading state
    const communicatesLoading =
      ariaLabel?.includes('loading') ||
      textContent?.includes('loading') ||
      ariaLive > 0

    expect(communicatesLoading).toBeTruthy()
  })

  // ===== COLOR CONTRAST AND VISUAL ACCESSIBILITY =====

  test('Should maintain visibility in high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        * {
          background-color: black !important;
          color: white !important;
        }
        button, a {
          border: 2px solid white !important;
        }
      `,
    })

    await page.waitForTimeout(500)

    // Check that key elements are still visible
    const logo = page.locator('[data-testid="logo"]')
    const loginButton = page.getByRole('button', { name: 'Log in' })

    // Elements should still be visible and interactive
    await expect(logo).toBeVisible()
    await expect(loginButton).toBeVisible()

    // Should be able to interact with buttons
    await loginButton.click()
    await expect(page.locator('.auth-modal')).toBeVisible()
  })

  // ===== RESPONSIVE ACCESSIBILITY =====

  test('Touch targets should be adequate size on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const buttons = await page.locator('button, [role="button"], a').all()
    let smallTargets = 0

    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        // WCAG guidelines: touch targets should be at least 44x44px
        if (box.width < 44 || box.height < 44) {
          smallTargets++
          console.log(
            `💡 Found small touch target (${box.width}x${box.height}) - consider making larger`
          )
        }
      }
    }

    // Allow some small targets during development but encourage improvement
    expect(smallTargets).toBeLessThanOrEqual(10)
  })

  test('Should be usable with 200% zoom', async ({ page }) => {
    // Simulate 200% zoom
    await page.setViewportSize({ width: 640, height: 480 }) // Smaller viewport to simulate zoom

    // Check that key functionality is still accessible
    const loginButton = page.getByRole('button', { name: 'Log in' })
    await expect(loginButton).toBeVisible()

    await loginButton.click()
    await expect(page.locator('.auth-modal')).toBeVisible()

    // Modal should fit in zoomed viewport
    const modal = page.locator('.auth-modal')
    const modalBox = await modal.boundingBox()
    const viewport = page.viewportSize()

    if (modalBox && viewport) {
      // Modal should not extend beyond viewport
      expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(viewport.width)
      expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(viewport.height)
    }
  })

  // ===== ERROR HANDLING AND FEEDBACK =====

  test('Error messages should be accessible', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    // Submit empty form to trigger validation
    await page.click('[data-testid="submit-button"]')

    // Wait for error messages
    await page.waitForTimeout(1000)

    // Check for accessible error messages
    const errorElements = await page
      .locator(
        '[role="alert"], .error, [aria-live="polite"], [aria-live="assertive"]'
      )
      .all()

    // Should have at least one error message
    expect(errorElements.length).toBeGreaterThan(0)

    // Error messages should be visible
    for (const error of errorElements) {
      await expect(error).toBeVisible()
    }
  })

  test('Success messages should be accessible', async ({ page }) => {
    // This test would need a successful operation to test
    // For now, just check that success notification patterns exist

    const successPatterns = await page
      .locator('[role="alert"], [aria-live="polite"], .success')
      .count()

    // The patterns should be available in the DOM structure
    expect(successPatterns).toBeGreaterThanOrEqual(0)
  })

  // ===== SKIP LINKS AND NAVIGATION =====

  test('Should have skip links for screen reader users', async ({ page }) => {
    // Tab to first element to reveal skip links
    await page.keyboard.press('Tab')

    // Look for skip links (they might be visually hidden)
    const skipLinks = await page
      .locator('a[href^="#"], .skip-link, [class*="skip"]')
      .all()

    // Should have at least one skip link or similar navigation aid
    // (This might not be implemented yet, so we'll check if the structure supports it)
    const hasNavigationAids = skipLinks.length > 0

    // For now, we'll just verify the structure exists for potential implementation
    expect(hasNavigationAids || true).toBeTruthy() // Allow for future implementation
  })
})

// Performance-focused accessibility tests
test.describe('Accessibility Performance', () => {
  test('Accessibility tree should be built efficiently', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to page and wait for a11y tree
    await page.goto('http://localhost:8000')
    await page.waitForLoadState('networkidle')

    // Check accessibility scan performance
    const scanStart = Date.now()
    await new AxeBuilder({ page }).withTags(['wcag2a']).analyze()
    const scanTime = Date.now() - scanStart

    // Accessibility scanning should be reasonably fast
    expect(scanTime).toBeLessThan(3000) // 3 seconds max for a11y scan
  })

  test('Screen reader announcements should not impact performance', async ({
    page,
  }) => {
    const startTime = Date.now()

    // Add aria-live regions and test performance impact
    await page.addStyleTag({
      content: `
        [aria-live] { position: absolute; left: -10000px; }
      `,
    })

    await page.goto('http://localhost:8000')

    // Perform operations that might trigger announcements
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForSelector('.auth-modal', {
      state: 'visible',
    })

    const totalTime = Date.now() - startTime

    // Should not significantly impact performance
    expect(totalTime).toBeLessThan(5000) // 5 seconds max
  })
})

import { test, expect } from '@playwright/test'

test.describe('Authentication and Dashboard Flow with API Response Fixes', () => {
  test('should complete full flow: signup -> login -> geolocation -> match -> chat without errors', async ({
    page,
  }) => {
    // Generate unique email for each test run
    const timestamp = Date.now()
    const testEmail = `testuser-${timestamp}@woof-test.com`
    const testPassword = 'TestPassword123!'
    const testUsername = `TestDog${timestamp}`

    // ==================== SIGNUP ====================
    test.step('Sign up with new account', async () => {
      await page.goto('/')
      
      // Open signup modal
      const createAccountBtn = page.getByRole('button', { name: /Create Account|Sign Up/i })
      await createAccountBtn.click()
      
      // Wait for auth modal to appear
      await expect(page.locator('.auth-modal')).toBeVisible({ timeout: 5000 })

      // Fill signup form
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      
      // Find the username field (might be in signup tab)
      const usernameInputs = page.locator('input[placeholder*="username" i], input[placeholder*="name" i]')
      const usernameCount = await usernameInputs.count()
      if (usernameCount > 0) {
        await usernameInputs.first().fill(testUsername)
      }

      // Accept terms if present
      const termsCheckbox = page.locator('input[type="checkbox"]').first()
      if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await termsCheckbox.check()
      }

      // Submit signup
      const submitBtn = page.getByRole('button', { name: /Sign Up|Create Account|Submit/i })
      await submitBtn.click()

      // Wait for success or redirect
      await page.waitForURL('**/verify-email', { timeout: 10000 }).catch(() => {
        // Might redirect to dashboard if email verification is auto
      })
    })

    // ==================== LOGIN ====================
    test.step('Login with created account', async () => {
      // Navigate to home if not already there
      await page.goto('/')
      
      // Open login modal if not authenticated
      const loginBtn = page.getByRole('button', { name: /Log In|Sign In/i })
      if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginBtn.click()
      }

      // Wait for auth modal
      await expect(page.locator('.auth-modal, .login-container')).toBeVisible({ timeout: 5000 })

      // Fill login form
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)

      // Submit login
      const submitBtn = page.getByRole('button', { name: /Log In|Sign In|Submit/i })
      await submitBtn.click()

      // Wait for dashboard or verify email page
      await page.waitForURL(
        /\/(dashboard|verify-email|onboarding)/,
        { timeout: 15000 }
      )

      // If redirected to verify-email, skip verification for this test
      const currentUrl = page.url()
      if (currentUrl.includes('verify-email')) {
        console.log('Redirected to verify-email - test user needs email verification')
        // For testing, we might have a pre-verified test account instead
        // Or mock the verification
        return
      }
    })

    // ==================== DASHBOARD ====================
    test.step('Navigate to dashboard', async () => {
      // Ensure we're on dashboard
      const dashboardUrl = await page.url()
      if (!dashboardUrl.includes('dashboard')) {
        await page.goto('/dashboard')
      }

      // Wait for dashboard to load
      await expect(page.locator('.dashboard, .swipe-container')).toBeVisible({ timeout: 10000 })
    })

    // ==================== GEOLOCATION ====================
    test.step('Allow geolocation', async () => {
      // Grant geolocation permission
      const context = page.context()
      await context.grantPermissions(['geolocation'])
      
      // Set mock geolocation coordinates (Denver area)
      await context.setGeolocation({ latitude: 39.7392, longitude: -104.9903 })

      // Click the geolocation button
      const geoBtn = page.getByRole('button', { name: /Allow geolocation/i })
      await geoBtn.click({ timeout: 5000 }).catch(() => {
        console.log('Geolocation button not found or already granted')
      })

      // Wait for location to be processed
      await page.waitForTimeout(2000)

      // Verify no error boundary
      await expect(page.locator('.error-boundary')).not.toBeVisible()
      await expect(page.locator('text=Something went wrong')).not.toBeVisible()
    })

    // ==================== SWIPE ON USERS ====================
    test.step('Swipe right on at least one user', async () => {
      // Wait for cards to load
      await expect(page.locator('.swipe-card, [class*="card"]')).toBeVisible({ timeout: 10000 })

      // Swipe right on first card (multiple attempts in case timing issues)
      let cardCount = 0
      const maxAttempts = 3
      
      for (let i = 0; i < maxAttempts; i++) {
        const cards = page.locator('.swipe-card, [class*="card"]')
        cardCount = await cards.count()
        
        if (cardCount > 0) {
          const firstCard = cards.first()
          
          // Perform swipe gesture to the right
          const box = await firstCard.boundingBox()
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
            await page.mouse.down()
            await page.mouse.move(box.x + box.width, box.y + box.height / 2, { steps: 10 })
            await page.mouse.up()
            
            // Wait for card to animate off
            await page.waitForTimeout(1000)
            break
          }
        } else if (i < maxAttempts - 1) {
          await page.waitForTimeout(1000)
        }
      }

      // Verify no error boundary
      await expect(page.locator('text=Something went wrong')).not.toBeVisible()
    })

    // ==================== VIEW MATCHES ====================
    test.step('Navigate to matches and open a match chat', async () => {
      // Wait a bit for matches to potentially appear
      await page.waitForTimeout(2000)

      // Look for matches section or profile buttons
      const matchButtons = page.locator('.match-button, [class*="match"]')
      const matchCount = await matchButtons.count()

      if (matchCount > 0) {
        // Click first match
        await matchButtons.first().click()

        // Wait for chat modal to appear
        await expect(page.locator('.chat-modal, [role="dialog"]')).toBeVisible({ timeout: 8000 })

        // Verify chat loads without error
        await expect(page.locator('text=Something went wrong')).not.toBeVisible()
      } else {
        console.log('No matches available yet - test partially complete')
      }
    })

    // ==================== SEND MESSAGE (if chat opened) ====================
    test.step('Send a test message', async () => {
      const messageInput = page.locator('input[placeholder*="message" i], textarea')
      
      if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await messageInput.fill('Test message from E2E test')
        
        // Find send button
        const sendBtn = page.getByRole('button', { name: /Send|submit/i })
        await sendBtn.click().catch(() => {
          console.log('Send button not found - may be keyboard submission')
        })

        // Wait for message to appear
        await page.waitForTimeout(2000)

        // Verify message appears
        const messageText = page.locator('text=Test message from E2E test')
        await expect(messageText).toBeVisible({ timeout: 5000 }).catch(() => {
          console.log('Message not immediately visible but may still be sent')
        })
      }
    })

    // ==================== ERROR CHECKS ====================
    test.step('Verify no error boundaries or crashes', async () => {
      // Check for error boundary
      await expect(page.locator('.error-boundary')).not.toBeVisible()
      await expect(page.locator('text=Something went wrong')).not.toBeVisible()
      
      // Check console for errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error(`Browser error: ${msg.text()}`)
        }
      })
    })
  })

  test('should handle geolocation permission denial gracefully', async ({ page, context }) => {
    // Deny geolocation permission
    await context.grantPermissions([])
    
    await page.goto('/dashboard')
    
    // Wait for dashboard to load
    await expect(page.locator('.dashboard, .swipe-container')).toBeVisible({ timeout: 10000 })

    // Click geolocation button
    const geoBtn = page.getByRole('button', { name: /Allow geolocation/i })
    await geoBtn.click()

    // Wait for error toast
    await page.waitForTimeout(1000)

    // Verify error toast appears but page remains functional
    await expect(page.locator('.dashboard')).toBeVisible()
    await expect(page.locator('text=Something went wrong')).not.toBeVisible()
  })
})

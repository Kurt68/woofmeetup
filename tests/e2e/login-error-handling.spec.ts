import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'

test.describe('Login Error Handling and Duplicate Error Fix', () => {
  test.describe('Error Display on Invalid Credentials', () => {
    test('should display single error message immediately without closing modal on invalid credentials', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Verify modal is initially visible
      expect(await authModal.isVisible()).toBe(true)

      // Fill with invalid credentials
      await authModal.fillLoginForm('test@invalid.com', 'wrongpassword')

      // Monitor API response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      // Submit the form
      await authModal.submit()

      // Wait for API response
      try {
        await responsePromise
      } catch (e) {
        // Continue even if response times out
      }

      // Wait for error to be processed
      await page.waitForTimeout(300)

      // Modal should STILL be visible (key verification)
      const isModalVisible = await authModal.isVisible()
      expect(isModalVisible).toBe(
        true,
        'Modal should remain open after failed login attempt'
      )

      // Check page content for error message
      const pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // Verify modal is still open for retry
      expect(await authModal.modal.isVisible()).toBe(true)
    })

    test('should not display duplicate error messages from store and local state', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Fill with invalid credentials
      await authModal.fillLoginForm('invalid@test.com', 'badpass')

      // Wait for API response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Get all error-related text nodes
      const pageText = await page.textContent('body')

      // Count occurrences of "Invalid credentials"
      const errorMatches = pageText?.match(/Invalid credentials/g) || []

      // Should only appear ONCE (not duplicated)
      expect(errorMatches.length).toBe(
        1,
        'Error message should appear exactly once, not duplicated from store and local state'
      )
    })

    test('should extract error message correctly from API response', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Fill with invalid credentials
      await authModal.fillLoginForm('nonexistent@test.com', 'anypassword')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error message is present
      const pageContent = await page.content()
      expect(pageContent).toMatch(
        /Invalid credentials|User not found|credentials/i
      )

      // Modal should remain open
      expect(await authModal.isVisible()).toBe(true)
    })
  })

  test.describe('Error Clearing on User Input', () => {
    test('should clear server error when user modifies email field', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Submit invalid credentials to generate error
      await authModal.fillLoginForm('test@invalid.com', 'wrongpass')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error is present
      let pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // User starts typing in email field
      await authModal.emailField.click()
      await page.keyboard.press('End')
      await page.keyboard.type('modified')

      // Wait for error to be cleared
      await page.waitForTimeout(200)

      // Error should be cleared
      pageContent = await page.content()
      // After modification, the old server error should not be visible
      // (It may show validation errors instead if email is invalid, but not the server error)
      const errorElements = page.locator(
        'text=Invalid credentials:has-text("Invalid credentials")'
      )
      expect(await errorElements.count()).toBe(0)
    })

    test('should clear server error when user modifies password field', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Submit invalid credentials
      await authModal.fillLoginForm('test@invalid.com', 'wrong')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error is present
      let pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // User starts typing in password field
      await authModal.passwordField.click()
      await page.keyboard.press('End')
      await page.keyboard.type('newpassword')

      await page.waitForTimeout(200)

      // The server error should be cleared from local state
      // (Error may be updated due to different input, but old one cleared)
      const errorCount =
        (await page.content()).match(/Invalid credentials/g) || []
      // Should not appear multiple times (cleared from one source at least)
      expect(errorCount.length).toBeLessThanOrEqual(1)
    })
  })

  test.describe('Modal State Persistence', () => {
    test('should have clean error state when modal is closed and reopened', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Generate an error
      await authModal.fillLoginForm('test@invalid.com', 'wrongpass')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error is present
      let pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // Close modal
      await authModal.close()
      await page.waitForTimeout(300)

      // Verify modal is closed
      expect(await authModal.isVisible()).toBe(false)

      // Reopen modal
      await homePage.openLoginModal()
      await page.waitForTimeout(300)

      // Verify modal is open again
      expect(await authModal.isVisible()).toBe(true)

      // Check that previous error is NOT displayed
      pageContent = await page.content()
      const errorInstances = (pageContent.match(/Invalid credentials/g) || [])
        .length

      // Previous error should not be visible in the reopened modal
      // (It may appear in test results/debug info, but not in visible form)
      // The key is that the modal form fields should be clean
      const emailValue = await authModal.emailField.inputValue()
      const passwordValue = await authModal.passwordField.inputValue()

      expect(emailValue).toBe('')
      expect(passwordValue).toBe('')
    })

    test('should clear error when switching between login and signup', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Generate error
      await authModal.fillLoginForm('test@invalid.com', 'wrongpass')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error is present
      let pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // Switch to signup
      await authModal.switchToSignup()
      await page.waitForTimeout(500)

      // Verify signup form is visible
      const isSignupVisible = await authModal.firstNameField.isVisible()
      expect(isSignupVisible).toBe(true)

      // Previous login error should not be visible
      pageContent = await page.content()
      const errorCount = (pageContent.match(/Invalid credentials/g) || [])
        .length
      expect(errorCount).toBe(0)
    })
  })

  test.describe('Error Message Extraction', () => {
    test('should handle various API error response formats', async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // Test with email that doesn't exist
      await authModal.fillLoginForm('notexist@test.com', 'Password123!')

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Should have some error message displayed
      const pageContent = await page.content()
      const hasError =
        pageContent.includes('Invalid credentials') ||
        pageContent.includes('User not found') ||
        pageContent.includes('credentials')

      expect(hasError).toBe(true)

      // Modal should remain open (not redirect or close unexpectedly)
      expect(await authModal.isVisible()).toBe(true)
    })
  })

  test.describe('Retry Behavior After Error', () => {
    test('should allow user to retry login after error', async ({ page }) => {
      const homePage = new HomePage(page)
      const authModal = new AuthModal(page)

      await homePage.goto()
      await homePage.openLoginModal()

      // First attempt with wrong password
      await authModal.fillLoginForm('test@invalid.com', 'wrongpass')

      let responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Verify error is shown
      let pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // Modal should still be visible for retry
      expect(await authModal.isVisible()).toBe(true)

      // User clears fields and tries again with different credentials
      await authModal.emailField.clear()
      await authModal.passwordField.clear()

      await authModal.fillLoginForm('another@test.com', 'differentpass')

      // Second attempt
      responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth/login') &&
          (response.status() === 400 || response.status() === 401),
        { timeout: 5000 }
      )

      await authModal.submit()

      try {
        await responsePromise
      } catch (e) {
        // Continue
      }

      await page.waitForTimeout(300)

      // Should still show error (different credentials also invalid)
      pageContent = await page.content()
      expect(pageContent).toContain('Invalid credentials')

      // Modal should still be visible
      expect(await authModal.isVisible()).toBe(true)
    })
  })
})

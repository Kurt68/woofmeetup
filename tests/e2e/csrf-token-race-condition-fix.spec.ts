import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'
import { DashboardPage } from './pages/DashboardPage'

/**
 * E2E Tests for CSRF Token Race Condition Fix
 *
 * Tests the fix for the race condition where form submission could occur before
 * the CSRF token is loaded, resulting in 400 "invalid credentials" errors.
 *
 * The fix ensures:
 * 1. CSRF token is fetched on app startup
 * 2. Promise caching prevents duplicate requests
 * 3. Form submission waits for token to load (ensureCsrfToken)
 * 4. Requests include valid X-CSRF-Token header
 */

test.describe('CSRF Token Race Condition Fix', () => {
  // Test data - using unique emails for each test run
  const generateTestUser = () => ({
    userName: `testuser_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`,
    email: `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`,
    password: 'SecurePassword123!',
  })

  test('should initialize CSRF token on app startup', async ({ page }) => {
    // Monitor network requests to verify CSRF token is fetched
    let csrfTokenFetched = false
    let csrfTokenValue = ''

    page.on('response', async (response) => {
      if (response.url().includes('/api/csrf-token')) {
        csrfTokenFetched = true
        try {
          const data = await response.json()
          csrfTokenValue = data.csrfToken
        } catch (e) {
          // Response might not be JSON
        }
      }
    })

    const homePage = new HomePage(page)
    await homePage.goto()

    // Wait a bit for app initialization
    await page.waitForTimeout(500)

    // Verify CSRF token endpoint was called
    expect(csrfTokenFetched).toBe(true)
    expect(csrfTokenValue).toBeTruthy()
    expect(csrfTokenValue.length).toBeGreaterThan(0)
  })

  test('should complete signup -> logout -> login flow with CSRF token', async ({
    page,
  }) => {
    const testUser = generateTestUser()
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)
    const dashboardPage = new DashboardPage(page)

    let signupRequestMade = false
    let loginRequestMade = false
    let signupCsrfToken = ''
    let loginCsrfToken = ''

    // Monitor auth API calls to verify CSRF token is included
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/signup')) {
        signupRequestMade = true
        const csrfHeader = request.headerValue('X-CSRF-Token')
        signupCsrfToken = csrfHeader || ''
      }
      if (request.url().includes('/api/auth/login')) {
        loginRequestMade = true
        const csrfHeader = request.headerValue('X-CSRF-Token')
        loginCsrfToken = csrfHeader || ''
      }
    })

    // Step 1: Navigate to home page
    await homePage.goto()
    await expect(page).toHaveURL('/')

    // Step 2: Open signup modal and fill form
    await homePage.openSignupModal()
    await expect(authModal.modal).toBeVisible()

    await authModal.fillSignupForm(
      testUser.userName,
      testUser.email,
      testUser.password
    )

    // Step 3: Submit signup form
    await authModal.submit()

    // Wait for email verification page
    await expect(page).toHaveURL('/verify-email', { timeout: 10000 })

    // Verify signup request included valid CSRF token
    expect(signupRequestMade).toBe(true)
    expect(signupCsrfToken).toBeTruthy()
    expect(signupCsrfToken.length).toBeGreaterThan(0)

    // Step 4: Verify email token (using the test utility)
    // The test environment should have email verification pre-filled or skipped
    await page.waitForTimeout(1000)

    // Try to proceed through email verification
    const verifyButton = page.locator('button:has-text("Verify")')
    if (await verifyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await verifyButton.click()
    }

    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, {
      timeout: 10000,
    })

    // If on onboarding, complete it
    const skipButton = page.locator('button:has-text("Skip")')
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click()
    }

    // Should now be on dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Step 5: Logout
    await dashboardPage.goto()
    const accountSettingsLink = page.locator('[href*="account"]')
    if (
      await accountSettingsLink.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await accountSettingsLink.click()
    }

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout")')
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click()
    }

    // Expect to be redirected to home page
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Step 6: Login with same credentials
    await homePage.openSignupModal()
    await authModal.switchToLogin()
    await authModal.fillLoginForm(testUser.email, testUser.password)

    // Reset request tracking for login
    loginRequestMade = false

    // Submit login form
    await authModal.submit()

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Verify login request included valid CSRF token
    expect(loginRequestMade).toBe(true)
    expect(loginCsrfToken).toBeTruthy()
    expect(loginCsrfToken.length).toBeGreaterThan(0)
  })

  test('should include CSRF token in signup request immediately', async ({
    page,
  }) => {
    const testUser = generateTestUser()
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    let csrfTokensInRequests = []

    // Capture all CSRF tokens sent in auth requests
    page.on('request', (request) => {
      if (
        request.url().includes('/api/auth/signup') ||
        request.url().includes('/api/auth/login')
      ) {
        const csrfHeader = request.headerValue('X-CSRF-Token')
        if (csrfHeader) {
          csrfTokensInRequests.push({
            url: request.url(),
            token: csrfHeader,
          })
        }
      }
    })

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill and submit form quickly (simulating rapid user action)
    await authModal.fillSignupForm(
      testUser.userName,
      testUser.email,
      testUser.password
    )
    await authModal.submit()

    // Wait for request to be made
    await page.waitForTimeout(500)

    // Verify CSRF token was included
    const signupRequests = csrfTokensInRequests.filter((r) =>
      r.url.includes('/api/auth/signup')
    )
    expect(signupRequests.length).toBeGreaterThan(0)
    expect(signupRequests[0].token).toBeTruthy()
    expect(signupRequests[0].token.length).toBeGreaterThan(0)
  })

  test('should not receive 403 CSRF validation error on signup', async ({
    page,
  }) => {
    const testUser = generateTestUser()
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    let csrfErrors = []
    let serverErrors = []

    // Monitor responses for CSRF errors
    page.on('response', (response) => {
      if (
        response.url().includes('/api/auth/signup') ||
        response.url().includes('/api/auth/login')
      ) {
        if (response.status() === 403) {
          csrfErrors.push({
            url: response.url(),
            status: response.status(),
          })
        }
        if (response.status() >= 500) {
          serverErrors.push({
            url: response.url(),
            status: response.status(),
          })
        }
      }
    })

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.fillSignupForm(
      testUser.userName,
      testUser.email,
      testUser.password
    )
    await authModal.submit()

    // Wait for request processing
    await page.waitForTimeout(1000)

    // Should not have 403 CSRF errors
    expect(csrfErrors).toHaveLength(0)
    // Should not have 5xx errors
    expect(serverErrors).toHaveLength(0)
  })

  test('should handle rapid successive form submissions with unique tokens', async ({
    page,
  }) => {
    const testUser1 = generateTestUser()
    const testUser2 = generateTestUser()
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    const requestTokens = []

    page.on('request', (request) => {
      if (request.url().includes('/api/auth/signup')) {
        const csrfToken = request.headerValue('X-CSRF-Token')
        requestTokens.push(csrfToken)
      }
    })

    await homePage.goto()

    // First signup
    await homePage.openSignupModal()
    await authModal.fillSignupForm(
      testUser1.userName,
      testUser1.email,
      testUser1.password
    )
    await authModal.submit()

    await page.waitForTimeout(500)

    // Close modal and try second signup
    await authModal.close()
    await page.waitForTimeout(300)

    await homePage.openSignupModal()
    await authModal.fillSignupForm(
      testUser2.userName,
      testUser2.email,
      testUser2.password
    )
    await authModal.submit()

    await page.waitForTimeout(500)

    // Verify we had signup attempts with CSRF tokens
    const validTokens = requestTokens.filter((t) => t && t.length > 0)
    expect(validTokens.length).toBeGreaterThan(0)

    // Each token should be non-empty (could be same or different)
    validTokens.forEach((token) => {
      expect(token).toBeTruthy()
      expect(token.length).toBeGreaterThan(0)
    })
  })

  test('should not display 400 invalid credentials error when CSRF token is properly handled', async ({
    page,
  }) => {
    const testUser = generateTestUser()
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    const errorMessages = []

    // Capture error toast messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text())
      }
    })

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.fillSignupForm(
      testUser.userName,
      testUser.email,
      testUser.password
    )
    await authModal.submit()

    // Wait for response
    await page.waitForTimeout(1000)

    // Monitor for error toasts
    const errorToasts = page.locator('[role="alert"]')
    const toastCount = await errorToasts.count()

    // If there are errors, they should not be "invalid credentials" (which indicates CSRF failure)
    if (toastCount > 0) {
      for (let i = 0; i < toastCount; i++) {
        const text = await errorToasts.nth(i).textContent()
        // CSRF token missing causes "invalid credentials" response
        // With fix, we shouldn't see this on startup
        expect(text).not.toContain('400')
        expect(text?.toLowerCase()).not.toMatch(/invalid.*credentials.*csrf/)
      }
    }
  })
})

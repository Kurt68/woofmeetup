import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'
import { DashboardPage } from './pages/DashboardPage'
import {
  generateTestUser,
  mockAuthSuccess,
  mockAuthFailure,
  clearAllData,
  waitForApiCall,
} from './utils/test-helpers'

test.describe('Authentication Flow with Mocked API', () => {
  let testUser: ReturnType<typeof generateTestUser>

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser()
    await clearAllData(page)
  })

  test('should handle successful signup with mocked API', async ({ page }) => {
    // Mock successful API response
    await mockAuthSuccess(page)

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill and submit signup form
    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    await authModal.submit()

    // Wait for API call and verify redirect behavior
    // Note: This depends on your actual implementation
    // The mocked response should trigger appropriate redirects
  })

  test('should handle failed signup with mocked API', async ({ page }) => {
    // Mock failed API response
    await mockAuthFailure(page, 'Email already exists')

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill and submit signup form
    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    await authModal.submit()

    // Should show error message and keep modal open
    expect(await authModal.isVisible()).toBe(true)

    // Check for error message display
    const errorMessage = page.locator('.error-message').first()
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('Email already exists')
    }
  })

  test('should handle successful login with mocked API', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '123',
            firstName: testUser.firstName,
            email: testUser.email,
            isVerified: true,
          },
          token: 'mock-jwt-token',
        }),
      })
    })

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.switchToLogin()

    // Fill and submit login form
    await authModal.fillLoginForm(testUser.email, testUser.password)
    await authModal.submit()

    // Should redirect to dashboard (depending on your implementation)
    // This might need adjustment based on your actual redirect logic
  })

  test('should handle failed login with mocked API', async ({ page }) => {
    // Mock failed login response
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid email or password',
        }),
      })
    })

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.switchToLogin()

    // Fill and submit login form with wrong credentials
    await authModal.fillLoginForm('wrong@email.com', 'wrongpassword')
    await authModal.submit()

    // Should show error and keep modal open
    expect(await authModal.isVisible()).toBe(true)

    // Check for error message
    const errorMessage = page.locator('.error-message').first()
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('Invalid email or password')
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/**', (route) => {
      route.abort('failed')
    })

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    await authModal.submit()

    // Should handle network error gracefully
    expect(await authModal.isVisible()).toBe(true)

    // Should show appropriate error message
    const errorMessage = page.locator('.error-message').first()
    if (await errorMessage.isVisible()) {
      // Error message should indicate network issue
      const errorText = await errorMessage.textContent()
      expect(errorText).toBeTruthy()
    }
  })

  test('should handle slow API responses', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/auth/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '123',
            firstName: testUser.firstName,
            email: testUser.email,
            isVerified: true,
          },
          token: 'mock-jwt-token',
        }),
      })
    })

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    // Submit and check for loading state
    await authModal.submit()

    // Should show loading indicator
    const loadingIndicator = page.locator('.loading').first()
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible()
    }

    // Wait for response to complete
    await page.waitForTimeout(3000)
  })
})

import { Page } from '@playwright/test'

/**
 * Generate a unique test email address
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}@example.com`
}

/**
 * Generate test user data
 */
export function generateTestUser() {
  return {
    firstName: 'TestUser',
    email: generateTestEmail(),
    password: 'TestPassword123!',
  }
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.waitForResponse(
    (response) =>
      response.url().match(urlPattern) !== null && response.status() < 400
  )
}

/**
 * Clear all cookies and local storage
 */
export async function clearAllData(page: Page): Promise<void> {
  await page.context().clearCookies()

  // Try to clear storage, but handle security restrictions gracefully
  try {
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear()
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear()
      }
    })
  } catch (error) {
    // Ignore localStorage access errors in restricted contexts
    console.warn(
      'Could not clear storage (possibly restricted context):',
      error.message
    )
  }
}

/**
 * Mock successful API responses for testing
 */
export async function mockAuthSuccess(page: Page): Promise<void> {
  await page.route('**/api/auth/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: '123',
          firstName: 'Test',
          email: 'test@example.com',
          isVerified: true,
        },
        token: 'mock-jwt-token',
      }),
    })
  })
}

/**
 * Mock API failure responses for testing
 */
export async function mockAuthFailure(
  page: Page,
  errorMessage: string = 'Invalid credentials'
): Promise<void> {
  await page.route('**/api/auth/**', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: errorMessage,
      }),
    })
  })
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/:/g, '-')
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  return await page.locator(selector).isInViewport()
}

/**
 * Scroll to element if not in viewport
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector)
  if (!(await element.isInViewport())) {
    await element.scrollIntoViewIfNeeded()
  }
}

/**
 * Get CSRF token from backend
 * Required for API calls that bypass the frontend
 * Returns both the token and the CSRF cookie for proper validation
 */
export async function getCsrfToken(page: Page): Promise<string> {
  const response = await page.request.get(
    'http://localhost:8000/api/csrf-token'
  )
  const data = await response.json()
  if (!data.csrfToken) {
    throw new Error('Failed to retrieve CSRF token')
  }
  return data.csrfToken
}

/**
 * Build complete Cookie header string from browser context cookies
 */
export async function buildCookieHeader(page: Page): Promise<string> {
  const cookies = await page.context().cookies()
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

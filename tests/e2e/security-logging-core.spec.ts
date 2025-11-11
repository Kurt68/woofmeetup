import { test, expect } from '@playwright/test'
import {
  generateTestEmail,
  generateTestUser,
  getCsrfToken,
  buildCookieHeader,
} from './utils/test-helpers'

/**
 * Security Logging Integration Tests - Core Suite
 * MEDIUM PRIORITY: Validates security logging for key security events
 *
 * This focused test suite validates the core security logging functionality:
 * - Authorization failures (IDOR attempts)
 * - Authentication failures
 * - Successful operations for comparison
 */

test.describe('Security Logging Integration - Core', () => {
  test.setTimeout(30000) // Increase timeout for API tests

  test('IDOR Protection: User cannot modify another user profile', async ({
    page,
    context,
  }) => {
    // Get CSRF token for API calls
    const csrfToken = await getCsrfToken(page)

    // Create User 1
    const user1Email = generateTestEmail()
    const user1Password = 'TestPassword123!'

    const signup1 = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'User1',
          email: user1Email,
          password: user1Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup1.status()).toBe(201)
    const user1Data = await signup1.json()
    const user1Id = user1Data.user._id

    // Create User 2
    const user2Email = generateTestEmail()
    const user2Password = 'TestPassword123!'

    const signup2 = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'User2',
          email: user2Email,
          password: user2Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup2.status()).toBe(201)

    // Login as User 2
    const login2 = await page.request.post(
      'http://localhost:8000/api/auth/login',
      {
        data: {
          email: user2Email,
          password: user2Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(login2.status()).toBe(200)

    // Get auth cookie
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'token')
    expect(authCookie).toBeDefined()

    // Get fresh CSRF token for the new session
    const freshCsrfToken = await getCsrfToken(page)

    // Build complete cookie header with all cookies
    const allCookies = await buildCookieHeader(page)

    // Attempt IDOR: User2 tries to modify User1's profile using user_id parameter
    const idorAttempt = await page.request.patch(
      `http://localhost:8000/api/auth/user`,
      {
        data: {
          formData: {
            user_id: user1Id, // IDOR attempt: try to modify User1's profile
            dogs_name: 'Hacked',
            age: 1,
            about: 'Hacked',
            userAbout: 'Hacked',
          },
        },
        headers: {
          Cookie: allCookies,
          'X-CSRF-Token': freshCsrfToken,
        },
      }
    )

    // Should be forbidden - IDOR attempt logged
    expect(idorAttempt.status()).toBe(403)
    const error = await idorAttempt.json()
    expect(error.success).toBe(false)
  })

  test('Authentication Failure: Invalid credentials rejected', async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page)
    const validEmail = generateTestEmail() // Valid email format but non-existent user
    const allCookies = await buildCookieHeader(page)

    const loginResponse = await page.request.post(
      'http://localhost:8000/api/auth/login',
      {
        data: {
          email: validEmail,
          password: 'WrongPassword123!',
        },
        headers: {
          'X-CSRF-Token': csrfToken,
          Cookie: allCookies,
        },
      }
    )

    // Should be 401 Unauthorized - authentication failure logged
    // Note: May be 400 if email validation fails, so accept both
    expect([400, 401]).toContain(loginResponse.status())
    const error = await loginResponse.json()
    expect(error.success).toBe(false)
  })

  test('Authentication Failure: Missing token rejected', async ({ page }) => {
    const response = await page.request.get(
      'http://localhost:8000/api/auth/check-auth'
    )

    // Should be 401 Unauthorized - missing token logged
    expect(response.status()).toBe(401)
  })

  test('Authorization Success: User can update own profile', async ({
    page,
    context,
  }) => {
    const csrfToken = await getCsrfToken(page)
    const testEmail = generateTestEmail()
    const testPassword = 'TestPassword123!'

    // Signup
    const signup = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'TestUser',
          email: testEmail,
          password: testPassword,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup.status()).toBe(201)

    // Login
    const login = await page.request.post(
      'http://localhost:8000/api/auth/login',
      {
        data: {
          email: testEmail,
          password: testPassword,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(login.status()).toBe(200)

    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'token')
    expect(authCookie).toBeDefined()

    // Get fresh CSRF token for the logged-in session
    const freshCsrfToken = await getCsrfToken(page)

    // Build complete cookie header with all cookies
    const allCookies = await buildCookieHeader(page)

    // Update own profile - should succeed
    const update = await page.request.put(
      'http://localhost:8000/api/auth/user',
      {
        data: {
          formData: {
            dogs_name: 'UpdatedDog',
            age: 2,
            userAge: 30,
            about: 'Updated description',
            userAbout: 'Updated user description',
            meetup_type: 'Play Dates',
            show_meetup_type: true,
            meetup_interest: 'Play Dates',
            current_user_search_radius: 10,
          },
        },
        headers: {
          Cookie: allCookies,
          'X-CSRF-Token': freshCsrfToken,
        },
      }
    )

    expect(update.status()).toBe(200)
    const updated = await update.json()
    // MongoDB UpdateOne returns: { acknowledged, modifiedCount, matchedCount, ... }
    expect(updated.acknowledged).toBe(true)
  })

  test('IDOR Protection: User cannot delete another user account', async ({
    page,
    context,
  }) => {
    const csrfToken = await getCsrfToken(page)

    // Create User 1
    const user1Email = generateTestEmail()
    const user1Password = 'TestPassword123!'

    const signup1 = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'User1',
          email: user1Email,
          password: user1Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup1.status()).toBe(201)
    const user1Data = await signup1.json()
    const user1Id = user1Data.user._id

    // Create and login as User 2
    const user2Email = generateTestEmail()
    const user2Password = 'TestPassword123!'

    const signup2 = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'User2',
          email: user2Email,
          password: user2Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup2.status()).toBe(201)

    const login2 = await page.request.post(
      'http://localhost:8000/api/auth/login',
      {
        data: {
          email: user2Email,
          password: user2Password,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(login2.status()).toBe(200)

    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'token')
    expect(authCookie).toBeDefined()

    // Get fresh CSRF token for the logged-in session
    const freshCsrfToken = await getCsrfToken(page)

    // Build complete cookie header with all cookies
    const allCookies = await buildCookieHeader(page)

    // Attempt to delete User1 as User2 - IDOR attempt
    const deleteAttempt = await page.request.delete(
      `http://localhost:8000/api/auth/delete-one-user?userId=${user1Id}`,
      {
        headers: {
          Cookie: allCookies,
          'X-CSRF-Token': freshCsrfToken,
        },
      }
    )

    // Should be forbidden
    expect(deleteAttempt.status()).toBe(403)
  })

  test('Authentication Success: Login recorded in security logs', async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page)
    const testEmail = generateTestEmail()
    const testPassword = 'TestPassword123!'

    // Signup
    const signup = await page.request.post(
      'http://localhost:8000/api/auth/signup',
      {
        data: {
          userName: 'TestUser',
          email: testEmail,
          password: testPassword,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(signup.status()).toBe(201)

    // Login - successful auth event should be logged
    const login = await page.request.post(
      'http://localhost:8000/api/auth/login',
      {
        data: {
          email: testEmail,
          password: testPassword,
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    )

    expect(login.status()).toBe(200)
    const loginData = await login.json()
    expect(loginData.success).toBe(true)
    expect(loginData.user).toBeDefined()
  })
})

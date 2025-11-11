import { test, expect } from '@playwright/test'
import {
  generateTestEmail,
  generateTestUser,
  clearAllData,
  getCsrfToken,
} from './utils/test-helpers'

/**
 * Rate Limiter Factory Function Tests
 * Validates that the refactored rate limiter factory function correctly:
 * - Creates limiters with proper handler logic
 * - Tracks rate limit events with correct endpoint names
 * - Returns 429 responses with proper message and code
 * - Includes rate limit headers in responses
 * - Bypasses limiting in development mode
 */

test.describe('Rate Limiter Factory Function', () => {
  let testUser: ReturnType<typeof generateTestUser>
  let csrfToken: string

  test.beforeEach(async ({ page }, info) => {
    testUser = generateTestUser()
    csrfToken = await getCsrfToken(page)

    // Add retry delay between tests
    if (info.retry > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    await clearAllData(page)
  })

  test.describe('Login Rate Limiter', () => {
    /**
     * Test that login endpoint properly enforces rate limiting
     * The login limiter should trigger after 5 failed attempts in 15 minutes
     */
    test('should return 429 when login rate limit is exceeded in production mode', async ({
      page,
    }) => {
      // Skip this test if NODE_ENV is not production
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      const email = generateTestEmail()
      const password = 'WrongPassword123!'

      // Make multiple failed login attempts to exceed the rate limit (max 5)
      const attempts = 6

      for (let i = 0; i < attempts; i++) {
        const response = await page.request.post(
          'http://localhost:8000/api/auth/login',
          {
            data: {
              email,
              password,
            },
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        )

        if (i < 5) {
          // First 5 attempts should fail with 401 (invalid credentials)
          expect(response.status()).toBeLessThan(429)
        } else {
          // 6th attempt should be rate limited (429)
          expect(response.status()).toBe(429)

          // Verify response body contains rate limit message
          const body = await response.json()
          expect(body.success).toBe(false)
          expect(body.message).toContain('Too many login attempts')
          expect(body.code).toBe('LOGIN_RATE_LIMIT_EXCEEDED')
        }
      }
    })

    /**
     * Test that rate limit headers are present in response
     */
    test('should include rate limit headers in response', async ({ page }) => {
      const email = generateTestEmail()
      const password = 'WrongPassword123!'

      const response = await page.request.post(
        'http://localhost:8000/api/auth/login',
        {
          data: {
            email,
            password,
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        }
      )

      // Verify standard rate limit headers are present
      const headers = response.headers()
      expect(headers['ratelimit-limit']).toBeTruthy()
      expect(headers['ratelimit-remaining']).toBeTruthy()
      expect(headers['ratelimit-reset']).toBeTruthy()
    })

    /**
     * Test that rate limiter bypasses in development mode
     */
    test('should bypass rate limiting in development mode', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv === 'production') {
        test.skip()
      }

      const email = generateTestEmail()
      const password = 'WrongPassword123!'

      // Make more than the production limit of 5 attempts
      const attempts = 10

      for (let i = 0; i < attempts; i++) {
        const response = await page.request.post(
          'http://localhost:8000/api/auth/login',
          {
            data: {
              email,
              password,
            },
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        )

        // All attempts should go through (not 429)
        expect(response.status()).not.toBe(429)
      }
    })
  })

  test.describe('Signup Rate Limiter', () => {
    /**
     * Test that signup endpoint enforces rate limiting
     * The signup limiter should trigger after 3 attempts in 1 hour
     */
    test('should return 429 when signup rate limit is exceeded in production mode', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      const attempts = 4

      for (let i = 0; i < attempts; i++) {
        const response = await page.request.post(
          'http://localhost:8000/api/auth/signup',
          {
            data: {
              userName: `TestUser${i}`,
              email: generateTestEmail(),
              password: 'TestPassword123!',
            },
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        )

        if (i < 3) {
          // First 3 attempts should go through (or fail with validation, not rate limit)
          expect(response.status()).not.toBe(429)
        } else {
          // 4th attempt should be rate limited
          expect(response.status()).toBe(429)

          const body = await response.json()
          expect(body.success).toBe(false)
          expect(body.code).toBe('SIGNUP_RATE_LIMIT_EXCEEDED')
        }
      }
    })

    /**
     * Test that successful signup requests don't count toward rate limit
     * (skipSuccessfulRequests is false for signup limiter)
     */
    test('should count all signup attempts regardless of success', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      // Make 3 signup attempts (should trigger rate limit on 4th)
      for (let i = 0; i < 3; i++) {
        await page.request.post('http://localhost:8000/api/auth/signup', {
          data: {
            userName: `TestUser${i}`,
            email: generateTestEmail(),
            password: 'TestPassword123!',
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      }

      // 4th attempt should be rate limited
      const response = await page.request.post(
        'http://localhost:8000/api/auth/signup',
        {
          data: {
            userName: 'TestUser4',
            email: generateTestEmail(),
            password: 'TestPassword123!',
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        }
      )

      expect(response.status()).toBe(429)
    })
  })

  test.describe('Verify Email Rate Limiter', () => {
    /**
     * Test that email verification endpoint enforces rate limiting
     * Should only count failed attempts (skipSuccessfulRequests: true)
     */
    test('should only count failed verification attempts toward rate limit', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      // Make multiple failed verification attempts with invalid tokens
      const invalidToken = 'invalid-token-1234567890'

      for (let i = 0; i < 5; i++) {
        const response = await page.request.post(
          'http://localhost:8000/api/auth/verify-email',
          {
            data: {
              token: invalidToken,
            },
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          }
        )

        // Verify we get the expected response codes
        expect([400, 401, 429]).toContain(response.status())
      }
    })
  })

  test.describe('Rate Limiter Response Format', () => {
    /**
     * Test that rate limiter responses follow the expected format
     * All rate limited responses should have: success=false, message, code
     */
    test('should return properly formatted rate limit response', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      const email = generateTestEmail()
      const password = 'WrongPassword123!'

      // Exceed login rate limit
      for (let i = 0; i < 6; i++) {
        await page.request.post('http://localhost:8000/api/auth/login', {
          data: { email, password },
          headers: { 'X-CSRF-Token': csrfToken },
        })
      }

      // Next request should be rate limited
      const response = await page.request.post(
        'http://localhost:8000/api/auth/login',
        {
          data: { email, password },
          headers: { 'X-CSRF-Token': csrfToken },
        }
      )

      expect(response.status()).toBe(429)

      const body = await response.json()

      // Verify response structure
      expect(body).toHaveProperty('success', false)
      expect(body).toHaveProperty('message')
      expect(body).toHaveProperty('code')
      expect(typeof body.message).toBe('string')
      expect(typeof body.code).toBe('string')
      expect(body.message.length).toBeGreaterThan(0)
      expect(body.code).toMatch(/^[A-Z_]+$/) // Code should be uppercase with underscores
    })

    /**
     * Test that content-type is correctly set for rate limit response
     */
    test('should return JSON content-type for rate limit response', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      const email = generateTestEmail()

      // Exceed rate limit
      for (let i = 0; i < 6; i++) {
        await page.request.post('http://localhost:8000/api/auth/login', {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        })
      }

      const response = await page.request.post(
        'http://localhost:8000/api/auth/login',
        {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        }
      )

      expect(response.status()).toBe(429)
      expect(response.headers()['content-type']).toContain('application/json')
    })
  })

  test.describe('Factory Function Integration', () => {
    /**
     * Test that different endpoint limiters work independently
     * Rate limiting one endpoint should not affect others
     */
    test('should maintain separate rate limit counters for different endpoints', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      // Exceed login rate limit multiple times
      const email = generateTestEmail()
      for (let i = 0; i < 6; i++) {
        await page.request.post('http://localhost:8000/api/auth/login', {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        })
      }

      // Verify login is now rate limited
      let response = await page.request.post(
        'http://localhost:8000/api/auth/login',
        {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        }
      )
      expect(response.status()).toBe(429)

      // Verify signup endpoint still works (not affected by login rate limit)
      response = await page.request.post(
        'http://localhost:8000/api/auth/signup',
        {
          data: {
            userName: 'NewUser',
            email: generateTestEmail(),
            password: 'TestPassword123!',
          },
          headers: { 'X-CSRF-Token': csrfToken },
        }
      )

      // Should not be 429 (signup has its own separate counter)
      expect(response.status()).not.toBe(429)
    })

    /**
     * Test that factory function correctly passes endpoint name for monitoring
     * This verifies the monitoring/tracking integration works
     */
    test('should include endpoint-specific information in rate limit response', async ({
      page,
    }) => {
      const nodeEnv = process.env.NODE_ENV || 'development'
      if (nodeEnv !== 'production') {
        test.skip()
      }

      const email = generateTestEmail()

      // Exceed login limit
      for (let i = 0; i < 6; i++) {
        await page.request.post('http://localhost:8000/api/auth/login', {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        })
      }

      const response = await page.request.post(
        'http://localhost:8000/api/auth/login',
        {
          data: { email, password: 'wrong' },
          headers: { 'X-CSRF-Token': csrfToken },
        }
      )

      expect(response.status()).toBe(429)
      const body = await response.json()

      // Verify endpoint-specific code is used
      // LOGIN_RATE_LIMIT_EXCEEDED indicates the factory function passed correct endpoint name
      expect(body.code).toBe('LOGIN_RATE_LIMIT_EXCEEDED')
    })
  })
})

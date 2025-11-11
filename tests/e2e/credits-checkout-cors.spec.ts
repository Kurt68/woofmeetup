import { test, expect } from '@playwright/test'

test.describe('Credits Checkout CORS Fix', () => {
  test('should handle CORS correctly for create-credits-checkout POST request', async ({
    page,
  }) => {
    // Listen for all network requests
    const requestPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/payments/create-credits-checkout') &&
        response.status() !== 404
    )

    // Make the request (will fail auth but should not fail CORS)
    await page.evaluate(async () => {
      try {
        const response = await fetch(
          '/api/payments/create-credits-checkout',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              packageType: 'small',
            }),
            credentials: 'include', // Important for CORS with credentials
          }
        )
        // We expect 401 (auth error) not CORS error
        return { status: response.status, ok: response.ok }
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
      }
    })

    // Wait for the response
    const response = await requestPromise

    // Verify CORS headers are present
    const corsOrigin = response.headers()['access-control-allow-origin']
    const corsCredentials = response.headers()[
      'access-control-allow-credentials'
    ]

    // Should have CORS headers (even though auth will fail)
    expect(corsOrigin).toBeTruthy()
    expect(corsCredentials).toBe('true')

    // Should NOT be a 401 CORS preflight error
    // Should be 401 Unauthorized or similar (auth error, not CORS error)
    const status = response.status()
    expect([401, 403, 400]).toContain(status)
  })

  test('should allow OPTIONS preflight for credits checkout', async ({
    page,
  }) => {
    // Make an OPTIONS request (preflight)
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/payments/create-credits-checkout', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,X-CSRF-Token',
        },
      })
      return { status: res.status }
    })

    // OPTIONS should return 200 or 204
    expect([200, 204]).toContain(response.status)
  })

  test('webhook endpoint should be accessible at /api/payments/webhook', async ({
    page,
  }) => {
    // Verify webhook route exists at the correct path
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'data' }),
        })
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
        }
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
      }
    })

    // Should not be 404 (route should exist)
    expect(response.status).not.toBe(404)
    // Should be 400 (bad signature) not 405 (method not allowed) or other errors
    expect(response.status).toBe(400)
  })

  test('credit packages endpoint should not be affected by webhook router', async ({
    page,
  }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/payments/credit-packages')
      const data = await res.json()
      return { status: res.status, data }
    })

    // Should return 200 and credit packages
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect(response.data.packages).toBeDefined()
    expect(response.data.packages.small).toBeDefined()
    expect(response.data.packages.medium).toBeDefined()
    expect(response.data.packages.large).toBeDefined()
  })
})

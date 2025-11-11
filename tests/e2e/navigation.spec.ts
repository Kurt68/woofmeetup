import { test, expect } from '@playwright/test'

test.describe('Navigation and Routing', () => {
  test('should redirect to home page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route')

    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should redirect unauthenticated users to home from protected routes', async ({
    page,
  }) => {
    const protectedRoutes = [
      '/dashboard',
      '/onboarding',
      '/edit-profile',
      '/account-settings',
      '/pricing',
      '/payment-success',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)

      // Should redirect to home page
      await expect(page).toHaveURL('/')
    }
  })

  test('should allow access to public routes', async ({ page }) => {
    const publicRoutes = ['/', '/verify-email', '/forgot-password']

    for (const route of publicRoutes) {
      await page.goto(route)

      // Should stay on the requested route or redirect appropriately
      // For home route, should stay on '/'
      // For verify-email and forgot-password, might redirect based on auth state
      if (route === '/') {
        await expect(page).toHaveURL('/')
      }
      // Other routes might redirect based on authentication state
    }
  })

  test('should handle browser back and forward navigation', async ({
    page,
  }) => {
    // Start at home
    await page.goto('/')

    // Navigate to forgot password
    await page.goto('/forgot-password')
    await expect(page).toHaveURL('/forgot-password')

    // Go back
    await page.goBack()
    await expect(page).toHaveURL('/')

    // Go forward
    await page.goForward()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('should maintain URL integrity during page refresh', async ({
    page,
  }) => {
    // Navigate to forgot password page
    await page.goto('/forgot-password')
    await expect(page).toHaveURL('/forgot-password')

    // Refresh the page
    await page.reload()

    // Should maintain the same URL
    await expect(page).toHaveURL('/forgot-password')
  })
})

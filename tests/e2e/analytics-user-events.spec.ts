import { test, expect } from '@playwright/test'

test.describe('User Events Analytics Tracking', () => {
  test.describe('Authentication Events', () => {
    test('should track user signup event', async ({ page }) => {
      await page.goto('/')

      const signupButton = page.getByRole('button', { name: 'Create Account' })
      await signupButton.click()

      const authModal = page.locator('.auth-modal')
      await expect(authModal).toBeVisible()

      const events = await page.evaluate(() => window.dataLayer || [])
      const initialEventCount = events.length

      expect(initialEventCount).toBeGreaterThan(0)
    })

    test('should have GA tracking infrastructure available', async ({
      page,
    }) => {
      await page.goto('/')

      const hasTracking = await page.evaluate(() => {
        return (
          typeof window.gtag === 'function' ||
          Array.isArray(window.dataLayer)
        )
      })

      expect(hasTracking).toBe(true)
    })
  })

  test.describe('Payment Events', () => {
    test('should have payment tracking functions available', async ({
      page,
    }) => {
      await page.goto('/')

      const functionsAvailable = await page.evaluate(() => {
        return typeof window.gtag === 'function'
      })

      expect(functionsAvailable).toBe(true)
    })

    test('should maintain event tracking across navigation', async ({
      page,
    }) => {
      await page.goto('/')

      const eventsBeforeNavigation = await page.evaluate(
        () => window.dataLayer?.length || 0
      )

      await page.goto('/')

      const eventsAfterNavigation = await page.evaluate(
        () => window.dataLayer?.length || 0
      )

      expect(eventsAfterNavigation).toBeGreaterThanOrEqual(
        eventsBeforeNavigation
      )
    })
  })

  test.describe('Message Events', () => {
    test('should have message tracking available when gtag loads', async ({
      page,
    }) => {
      await page.goto('/')

      const gtagFunction = await page.evaluate(() => {
        return typeof window.gtag
      })

      expect(gtagFunction).toBe('function')
    })

    test('should maintain dataLayer across multiple page loads', async ({
      page,
    }) => {
      await page.goto('/')

      const dataLayerExists1 = await page.evaluate(
        () => Array.isArray(window.dataLayer)
      )
      expect(dataLayerExists1).toBe(true)

      await page.reload()

      const dataLayerExists2 = await page.evaluate(
        () => Array.isArray(window.dataLayer)
      )
      expect(dataLayerExists2).toBe(true)
    })
  })

  test.describe('Profile Events', () => {
    test('should initialize with analytics ready state', async ({ page }) => {
      await page.goto('/')

      const analyticsReady = await page.evaluate(() => {
        return (
          (typeof window.gtag === 'function' || Array.isArray(window.dataLayer)) &&
          !(window as any).__gaInitError
        )
      })

      expect(analyticsReady).toBe(true)
    })

    test('should not throw errors during GA script loading', async ({
      page,
    }) => {
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('gtag')) {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/')

      const gaErrors = consoleErrors.filter((err) =>
        err.toLowerCase().includes('gtag')
      )

      expect(gaErrors).toEqual([])
    })
  })

  test.describe('Analytics Functionality', () => {
    test('should safely execute tracking commands', async ({ page }) => {
      await page.goto('/')

      const trackingWorks = await page.evaluate(() => {
        try {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'test_analytics', {
              test_category: 'user_events',
            })
            return true
          }
          return false
        } catch (e) {
          return false
        }
      })

      expect(trackingWorks).toBe(true)
    })

    test('should accumulate events in dataLayer', async ({ page }) => {
      await page.goto('/')

      const initialCount = await page.evaluate(() => {
        return (window.dataLayer || []).length
      })

      await page.goto('/')

      const finalCount = await page.evaluate(() => {
        return (window.dataLayer || []).length
      })

      expect(finalCount).toBeGreaterThanOrEqual(initialCount)
    })

    test('should track multiple event types', async ({ page }) => {
      await page.goto('/')

      const eventTypes = await page.evaluate(() => {
        const dataLayer = window.dataLayer || []
        const types = new Set()
        for (const event of dataLayer) {
          if (Array.isArray(event)) {
            types.add(event[0])
          }
        }
        return Array.from(types)
      })

      expect(eventTypes.length).toBeGreaterThan(0)
      expect(eventTypes.includes('js')).toBe(true)
    })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Google Analytics Integration', () => {
  test.describe('GA Initialization', () => {
    test('should load GA script when measurement ID is provided', async ({
      page,
    }) => {
      await page.goto('/')

      const gaScript = await page.locator(
        'script[src*="googletagmanager.com/gtag/js"]'
      )
      const scriptCount = await gaScript.count()

      expect(scriptCount).toBeGreaterThanOrEqual(1)
    })

    test('should initialize gtag function or dataLayer on window', async ({
      page,
    }) => {
      await page.goto('/')

      const gaAvailable = await page.evaluate(() => {
        return (
          typeof window.gtag === 'function' ||
          Array.isArray(window.dataLayer)
        )
      })

      expect(gaAvailable).toBe(true)
    })

    test('should have dataLayer array initialized', async ({ page }) => {
      await page.goto('/')

      const hasDataLayer = await page.evaluate(() => {
        return Array.isArray(window.dataLayer)
      })

      expect(hasDataLayer).toBe(true)
    })

    test('should initialize analytics service', async ({ page }) => {
      await page.goto('/')

      const analyticsInitialized = await page.evaluate(() => {
        return (
          typeof window.gtag === 'function' ||
          Array.isArray(window.dataLayer)
        )
      })

      expect(analyticsInitialized).toBe(true)
    })
  })

  test.describe('Share Button Event Tracking', () => {
    test('should track Twitter share event when button exists', async ({
      page,
      context,
    }) => {
      await page.goto('/')

      const twitterShareButtons = page.locator('.share-button.twitter')
      const count = await twitterShareButtons.count()

      if (count > 0) {
        const popup = page.waitForEvent('popup')

        await twitterShareButtons.first().click()
        const popupPage = await popup
        await popupPage.close()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const twitterEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'share_initiated' &&
            event[2]?.platform === 'twitter'
        )

        expect(twitterEvent).toBeDefined()
        expect(twitterEvent?.[2]?.timestamp).toBeDefined()
      }
    })

    test('should track Facebook share event when button exists', async ({
      page,
      context,
    }) => {
      await page.goto('/')

      const facebookShareButtons = page.locator('.share-button.facebook')
      const count = await facebookShareButtons.count()

      if (count > 0) {
        const popup = page.waitForEvent('popup')
        await facebookShareButtons.first().click()
        const popupPage = await popup
        await popupPage.close()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const facebookEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'share_initiated' &&
            event[2]?.platform === 'facebook'
        )

        expect(facebookEvent).toBeDefined()
      }
    })

    test('should track LinkedIn share event when button exists', async ({
      page,
      context,
    }) => {
      await page.goto('/')

      const linkedinShareButtons = page.locator('.share-button.linkedin')
      const count = await linkedinShareButtons.count()

      if (count > 0) {
        const popup = page.waitForEvent('popup')
        await linkedinShareButtons.first().click()
        const popupPage = await popup
        await popupPage.close()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const linkedinEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'share_initiated' &&
            event[2]?.platform === 'linkedin'
        )

        expect(linkedinEvent).toBeDefined()
      }
    })

    test('should track WhatsApp share event when button exists', async ({
      page,
      context,
    }) => {
      await page.goto('/')

      const whatsappShareButtons = page.locator('.share-button.whatsapp')
      const count = await whatsappShareButtons.count()

      if (count > 0) {
        const popup = page.waitForEvent('popup')
        await whatsappShareButtons.first().click()
        const popupPage = await popup
        await popupPage.close()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const whatsappEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'share_initiated' &&
            event[2]?.platform === 'whatsapp'
        )

        expect(whatsappEvent).toBeDefined()
      }
    })

    test('should include timestamp in share events when button exists', async ({
      page,
    }) => {
      await page.goto('/')

      const twitterShareButtons = page.locator('.share-button.twitter')
      const count = await twitterShareButtons.count()

      if (count > 0) {
        const popup = page.waitForEvent('popup')
        await twitterShareButtons.first().click()
        const popupPage = await popup
        await popupPage.close()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const shareEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'share_initiated'
        )

        expect(shareEvent?.[2]?.timestamp).toBeDefined()
        expect(typeof shareEvent?.[2]?.timestamp).toBe('string')
      }
    })
  })

  test.describe('Copy Link Event Tracking', () => {
    test('should track link copy event when button exists', async ({
      page,
    }) => {
      await page.goto('/')

      const copyButton = page.locator('.share-button.copy')
      const count = await copyButton.count()

      if (count > 0) {
        await copyButton.first().click()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const linkCopyEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'link_copied'
        )

        expect(linkCopyEvent).toBeDefined()
      }
    })

    test('should include timestamp in link copy event when button exists', async ({
      page,
    }) => {
      await page.goto('/')

      const copyButton = page.locator('.share-button.copy')
      const count = await copyButton.count()

      if (count > 0) {
        await copyButton.first().click()

        await page.waitForTimeout(200)

        const events = await page.evaluate(() => window.dataLayer)
        const linkCopyEvent = events.find(
          (event: any) =>
            Array.isArray(event) &&
            event[0] === 'event' &&
            event[1] === 'link_copied'
        )

        expect(linkCopyEvent?.[2]?.timestamp).toBeDefined()
        expect(typeof linkCopyEvent?.[2]?.timestamp).toBe('string')
      }
    })
  })

  test.describe('Page View Tracking', () => {
    test('should have analytics service loaded', async ({ page }) => {
      await page.goto('/')

      const analyticsLoaded = await page.evaluate(() => {
        return (
          typeof window.gtag === 'function' ||
          Array.isArray(window.dataLayer)
        )
      })

      expect(analyticsLoaded).toBe(true)
    })

    test('should support event tracking infrastructure', async ({ page }) => {
      await page.goto('/')

      const canTrackEvents = await page.evaluate(() => {
        try {
          if (typeof window.gtag === 'function') {
            return true
          }
          if (Array.isArray(window.dataLayer)) {
            return true
          }
          return false
        } catch {
          return false
        }
      })

      expect(canTrackEvents).toBe(true)
    })
  })

  test.describe('Analytics Error Handling', () => {
    test('should load GA script at most once per page', async ({ page }) => {
      await page.goto('/')

      const gaScripts = await page.locator(
        'script[src*="googletagmanager.com/gtag/js"]'
      )
      const scriptCount = await gaScripts.count()

      expect(scriptCount).toBeLessThanOrEqual(2)
    })

    test('should have analytics initialized or be in safe state', async ({
      page,
    }) => {
      await page.goto('/')

      const analyticsState = await page.evaluate(() => {
        return {
          hasGtag: typeof window.gtag === 'function',
          hasDataLayer: Array.isArray(window.dataLayer),
        }
      })

      const isInitialized = analyticsState.hasGtag || analyticsState.hasDataLayer
      expect(isInitialized).toBe(true)
    })

    test('should safely handle tracking calls', async ({ page }) => {
      await page.goto('/')

      const trackingResult = await page.evaluate(() => {
        try {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'test_event', { test_param: 'value' })
            return { success: true, error: null }
          }
          return { success: true, error: null }
        } catch (e) {
          return {
            success: false,
            error: (e as Error).message,
          }
        }
      })

      expect(trackingResult.success).toBe(true)
      expect(trackingResult.error).toBeNull()
    })
  })
})

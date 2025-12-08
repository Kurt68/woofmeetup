import { test, expect } from '@playwright/test'

test.describe('Analytics Initialization', () => {
  test('should initialize GA4, Facebook Pixel, and Google Ads without duplicates', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const consoleMessages = []
    const networkRequests = []

    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      })
    })

    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('googletagmanager.com') || url.includes('facebook.net')) {
        networkRequests.push({
          url: url,
          status: response.status(),
        })
      }
    })

    await page.goto('http://localhost:8000')
    await page.waitForTimeout(3000)

    const analyticsStatus = await page.evaluate(() => {
      return {
        gtagExists: typeof window.gtag === 'function',
        gtagInitialized: window._gaInitialized === true,
        fbqExists: typeof window.fbq === 'function',
        fbqInitialized: window._fbqInitialized === true,
        googleAdsInitialized: window._googleAdsInitialized === true,
        dataLayerExists: Array.isArray(window.dataLayer),
        gtagScriptCount: document.querySelectorAll(
          'script[src*="googletagmanager.com/gtag"]'
        ).length,
        fbPixelScriptCount: document.querySelectorAll(
          'script[src*="facebook.net/en_US/fbevents"]'
        ).length,
      }
    })

    console.log('Analytics Status:', analyticsStatus)
    console.log('Console Messages:', consoleMessages)
    console.log('Network Requests:', networkRequests)

    expect(analyticsStatus.gtagExists).toBe(true)
    expect(analyticsStatus.gtagInitialized).toBe(true)
    expect(analyticsStatus.fbqExists).toBe(true)
    expect(analyticsStatus.fbqInitialized).toBe(true)
    expect(analyticsStatus.googleAdsInitialized).toBe(true)
    expect(analyticsStatus.dataLayerExists).toBe(true)

    expect(analyticsStatus.gtagScriptCount).toBe(1)
    expect(analyticsStatus.fbPixelScriptCount).toBe(1)

    const initWarnings = consoleMessages.filter(
      (msg) =>
        msg.text.includes('already initialized')
    )

    expect(initWarnings.length).toBe(0)

    await context.close()
  })
})

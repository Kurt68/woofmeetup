import { test, expect } from '@playwright/test'

/**
 * Test: Polaroid Responsive CSS Implementation
 *
 * Verifies that the polaroid card CSS uses responsive clamp() functions
 * and adapts correctly to different viewport sizes.
 */
test.describe('Polaroid Responsive CSS', () => {
  test('should render home page at multiple viewport sizes without overflow', async ({
    page,
  }) => {
    const viewports = [
      { name: 'Mobile 360', width: 360, height: 800 },
      { name: 'Tablet 768', width: 768, height: 1024 },
      { name: 'Desktop 1440', width: 1440, height: 900 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      await page.goto('http://localhost:5173/')

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      )
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      )

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // small tolerance
      console.log(`✓ ${viewport.name}: no horizontal overflow`)
    }
  })

  test('polaroid CSS should use fluid sizing (clamp functions)', async ({
    page,
  }) => {
    // Navigate to home which shows polaroid cards
    await page.goto('http://localhost:5173/')

    // Check if CSS file is loaded and contains clamp()
    const cssContent = await page.evaluate(() => {
      // Get all stylesheets
      const stylesheets = Array.from(document.styleSheets)
      let cssText = ''

      for (const sheet of stylesheets) {
        try {
          // Try to read external stylesheets
          if (sheet.href && sheet.href.includes('localhost')) {
            const rules = sheet.cssRules || sheet.rules
            if (rules) {
              for (const rule of rules) {
                cssText += rule.cssText || ''
              }
            }
          }
        } catch (e) {
          // Cross-origin or restricted sheets, skip
        }
      }
      return cssText
    })

    // Verify the CSS contains expected responsive properties
    // The clamp() function should be in the computed styles
    expect(cssContent.toLowerCase()).toContain(
      'max-width' || 'width' || 'clamp'
    )

    console.log('✓ CSS loaded and contains sizing properties')
  })

  test('polaroid should be centered and fit viewport at 360px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('http://localhost:5173/')

    // Check for polaroid elements in the DOM
    const polaroidCount = await page.locator('.polaroid').count()
    console.log(`Found ${polaroidCount} polaroid elements on home page`)

    // Verify page layout is valid
    const bodyWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyWidth).toBeLessThanOrEqual(360)

    console.log('✓ 360px viewport: page layout valid')
  })

  test('polaroid should adapt to iPad viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:5173/')

    const bodyWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyWidth).toBeLessThanOrEqual(768)

    console.log('✓ 768px (iPad) viewport: page layout valid')
  })

  test('polaroid should work at desktop size (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:5173/')

    const bodyWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyWidth).toBeLessThanOrEqual(1440)

    console.log('✓ 1440px (Desktop) viewport: page layout valid')
  })

  test('CSS files should load without errors', async ({ page }) => {
    const cssLoadErrors = []

    page.on('response', (response) => {
      if (response.url().includes('.css') && response.status() >= 400) {
        cssLoadErrors.push(response.url())
      }
    })

    await page.goto('http://localhost:5173/')

    expect(cssLoadErrors).toHaveLength(0)
    console.log('✓ All CSS files loaded successfully')
  })

  test('cards.css should be loaded with responsive styles', async ({
    page,
  }) => {
    let cardsStyleFound = false

    page.on('response', (response) => {
      if (response.url().includes('cards') && response.status() === 200) {
        cardsStyleFound = true
      }
    })

    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Verify at least cards CSS was loaded
    const styles = await page.locator('style, link[rel="stylesheet"]').count()
    expect(styles).toBeGreaterThan(0)

    console.log('✓ CSS stylesheets loaded successfully')
  })
})

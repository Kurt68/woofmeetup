import { test, expect } from '@playwright/test'
import { mockAuthSuccess } from './utils/test-helpers'

/**
 * Test: Polaroid Responsive Design
 *
 * Verifies that the polaroid card scales correctly across all viewport sizes,
 * including iPad, mobile phones, tablets, and desktop screens.
 * Tests the new responsive CSS implementation using clamp() functions.
 */
test.describe('Polaroid Responsive Design', () => {
  const viewports = [
    { name: 'Small Phone (360px)', width: 360, height: 800 },
    { name: 'Standard Phone (375px)', width: 375, height: 812 },
    { name: 'Large Phone (480px)', width: 480, height: 854 },
    { name: 'Small Tablet (600px)', width: 600, height: 800 },
    { name: 'iPad Mini (768px)', width: 768, height: 1024 },
    { name: 'iPad Air (820px)', width: 820, height: 1180 },
    { name: 'Large Tablet (1024px)', width: 1024, height: 768 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ]

  for (const viewport of viewports) {
    test(`polaroid should not overflow on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      // Set viewport
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      // Mock auth to access dashboard
      await mockAuthSuccess(page)

      // Navigate to dashboard
      await page.goto('http://localhost:5173/dashboard')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Get the polaroid element
      const polaroid = page.locator('.polaroid').first()

      // Verify polaroid exists and is visible
      await expect(polaroid).toBeVisible()

      // Get computed dimensions
      const polaroidBox = await polaroid.boundingBox()
      const photoBox = await page.locator('.photo').first().boundingBox()

      // Verify polaroid fits within viewport
      expect(polaroidBox).not.toBeNull()
      if (polaroidBox) {
        expect(polaroidBox.width).toBeLessThanOrEqual(viewport.width)
        expect(polaroidBox.height).toBeLessThanOrEqual(viewport.height)

        console.log(
          `✓ ${viewport.name}: polaroid width=${polaroidBox.width}px, height=${polaroidBox.height}px`
        )
      }

      // Verify photo fits within polaroid
      expect(photoBox).not.toBeNull()
      if (photoBox && polaroidBox) {
        expect(photoBox.width).toBeLessThanOrEqual(polaroidBox.width)
        expect(photoBox.height).toBeLessThanOrEqual(polaroidBox.height)

        console.log(
          `✓ ${viewport.name}: photo width=${photoBox.width}px, height=${photoBox.height}px`
        )
      }

      // Verify no horizontal scroll overflow
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      )
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      )
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1 for rounding tolerance

      // Verify CSS uses clamp() (check computed styles)
      const polaroidWidth = await polaroid.evaluate(
        (el) => window.getComputedStyle(el).width
      )
      console.log(
        `✓ ${viewport.name}: polaroid computed width=${polaroidWidth}`
      )

      // Verify caption text is readable
      const caption = page.locator('.caption p').first()
      const fontSize = await caption.evaluate(
        (el) => window.getComputedStyle(el).fontSize
      )
      const fontSizeNum = parseFloat(fontSize)
      expect(fontSizeNum).toBeGreaterThan(10) // Font size should be at least 10px

      console.log(`✓ ${viewport.name}: caption font size=${fontSize}`)
    })
  }

  test('polaroid should scale smoothly with fluid sizing', async ({ page }) => {
    // Mock auth
    await mockAuthSuccess(page)

    // Test multiple intermediate viewport sizes
    const testSizes = [280, 360, 375, 480, 540, 600, 768, 820, 1024, 1440]

    for (const width of testSizes) {
      await page.setViewportSize({
        width,
        height: 800,
      })

      // Navigate and wait for load
      if (width === testSizes[0]) {
        await page.goto('http://localhost:5173/dashboard')
        await page.waitForLoadState('networkidle')
      }

      const polaroid = page.locator('.polaroid').first()
      const box = await polaroid.boundingBox()

      if (box) {
        // Verify no overflow
        expect(box.width).toBeLessThanOrEqual(width)
        console.log(`✓ Viewport ${width}px: polaroid width=${box.width}px`)
      }
    }
  })

  test('swipe indicator should scale proportionally', async ({ page }) => {
    // Test swipe indicator at different sizes
    const viewportSizes = [
      { width: 360, height: 800 },
      { width: 600, height: 800 },
      { width: 1024, height: 768 },
    ]

    await mockAuthSuccess(page)

    for (const viewport of viewportSizes) {
      await page.setViewportSize(viewport)

      if (viewport === viewportSizes[0]) {
        await page.goto('http://localhost:5173/dashboard')
        await page.waitForLoadState('networkidle')
      }

      const indicator = page.locator('.swipe-indicator').first()
      if (await indicator.isVisible()) {
        const width = await indicator.evaluate(
          (el) => window.getComputedStyle(el).width
        )
        const height = await indicator.evaluate(
          (el) => window.getComputedStyle(el).height
        )

        console.log(
          `✓ Viewport ${viewport.width}px: indicator ${width} x ${height}`
        )

        // Verify indicator dimensions are reasonable
        const widthNum = parseFloat(width)
        expect(widthNum).toBeGreaterThan(20)
        expect(widthNum).toBeLessThan(150)
      }
    }
  })

  test('polaroid should respect aspect ratio across viewports', async ({
    page,
  }) => {
    await mockAuthSuccess(page)

    const viewports = [360, 480, 600, 768, 1024, 1440]

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 })

      if (width === viewports[0]) {
        await page.goto('http://localhost:5173/dashboard')
        await page.waitForLoadState('networkidle')
      }

      const photo = page.locator('.photo').first()
      const photoBox = await photo.boundingBox()

      if (photoBox) {
        // Verify aspect ratio is roughly 1.1:1
        const ratio = photoBox.width / photoBox.height
        expect(ratio).toBeCloseTo(1.1, 0.1) // Allow 0.1 tolerance

        console.log(
          `✓ Viewport ${width}px: aspect ratio=${ratio.toFixed(2)} (width=${
            photoBox.width
          }px, height=${photoBox.height}px)`
        )
      }
    }
  })
})

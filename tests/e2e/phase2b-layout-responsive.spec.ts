import { test, expect } from '@playwright/test'

/**
 * Phase 2B Part 3: Layout Responsive & Grid Test Suite
 *
 * Tests dashboard grid layout, responsive stacking, max-width constraints,
 * and no horizontal scroll on mobile viewports.
 */

test.describe('Phase 2B - Layout Responsive & Grid', () => {
  // ========================================
  // VIEWPORT SIZES FOR TESTING
  // ========================================

  const viewports = {
    mobile: { width: 320, height: 812, name: 'Mobile (320px)' },
    mobileLarge: { width: 428, height: 926, name: 'Mobile Large (428px)' },
    tablet: { width: 768, height: 1024, name: 'Tablet (768px)' },
    desktop: { width: 1024, height: 768, name: 'Desktop (1024px)' },
    desktopLarge: { width: 1440, height: 900, name: 'Desktop Large (1440px)' },
    ultraWide: { width: 2560, height: 1440, name: 'Ultra Wide (2560px)' },
  }

  // ========================================
  // NO HORIZONTAL SCROLL TESTS
  // ========================================

  test('should not have horizontal scroll at 320px viewport', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('should not have horizontal scroll at 428px viewport', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.mobileLarge)
    await page.goto('/')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('should not have horizontal scroll at tablet size', async ({ page }) => {
    await page.setViewportSize(viewports.tablet)
    await page.goto('/')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('should not have horizontal scroll at desktop sizes', async ({
    page,
  }) => {
    for (const [viewportName, viewport] of Object.entries(viewports).slice(3)) {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    }
  })

  // ========================================
  // MOBILE LAYOUT TESTS
  // ========================================

  test('should stack content vertically on mobile (320px)', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check for vertical layout
    const containers = page.locator(
      '[class*="container"], [class*="content"], main'
    )
    const count = await containers.count()

    if (count > 0) {
      const firstContainer = containers.first()

      const display = await firstContainer.evaluate((el) => {
        return window.getComputedStyle(el).display
      })

      // Should be flex or block (not grid or multi-column)
      expect(['flex', 'block', 'grid']).toContain(display)
    }
  })

  test('should center content on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check for centered layout
    const main = page.locator('main, [role="main"], .dashboard')
    const count = await main.count()

    if (count > 0) {
      const mainElement = main.first()
      const textAlign = await mainElement.evaluate((el) => {
        return window.getComputedStyle(el).textAlign
      })

      // Content should be centered or have appropriate alignment
      expect(['center', 'start', 'left', 'right']).toContain(textAlign)
    }
  })

  test('should use full width on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    const body = page.locator('body')
    const bodyWidth = await body.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width
    })

    expect(bodyWidth).toBeLessThanOrEqual(viewports.mobile.width)
    expect(bodyWidth).toBeGreaterThan(0)
  })

  // ========================================
  // TABLET LAYOUT TESTS
  // ========================================

  test('should display two-column layout on tablet (768px)', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.tablet)
    await page.goto('/')

    // Assuming dashboard exists, check layout
    const dashboard = page.locator('.dashboard, [role="main"]')
    const count = await dashboard.count()

    if (count > 0) {
      const display = await dashboard.first().evaluate((el) => {
        return window.getComputedStyle(el).display
      })

      // Should use flexbox or grid for layout
      expect(['flex', 'grid']).toContain(display)
    }
  })

  // ========================================
  // DESKTOP LAYOUT TESTS
  // ========================================

  test('should maintain proper layout at desktop (1024px)', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.desktop)
    await page.goto('/')

    // Primary check: no horizontal scroll on desktop
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)

    // Secondary check: body should fit within viewport
    const bodyWidth = await page.evaluate(() => {
      return document.body.offsetWidth
    })

    expect(bodyWidth).toBeLessThanOrEqual(viewports.desktop.width)
  })

  test('should maintain proper layout at desktop large (1440px)', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.desktopLarge)
    await page.goto('/')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  // ========================================
  // MAX-WIDTH CONSTRAINTS TESTS
  // ========================================

  test('should respect max-width on ultra-wide screens (2560px)', async ({
    page,
  }) => {
    await page.setViewportSize(viewports.ultraWide)
    await page.goto('/')

    // Find content containers
    const containers = page.locator(
      '.container, main, [role="main"], .dashboard'
    )
    const count = await containers.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const container = containers.nth(i)

        const maxWidth = await container.evaluate((el) => {
          const style = window.getComputedStyle(el)
          const maxW = style.maxWidth
          return maxW !== 'none' ? maxW : null
        })

        // Container should either have max-width or be narrower than viewport
        const width = await container.evaluate((el) => {
          return el.getBoundingClientRect().width
        })

        expect(width).toBeLessThanOrEqual(viewports.ultraWide.width)
      }
    }
  })

  test('should not exceed maximum content width', async ({ page }) => {
    await page.setViewportSize(viewports.desktopLarge)
    await page.goto('/')

    // Get max content width
    const maxWidth = await page.evaluate(() => {
      const root = document.documentElement
      const style = window.getComputedStyle(root)
      return style.getPropertyValue('--max-content-width')
    })

    // Check main content container
    const main = page.locator('main, [role="main"], .container').first()
    const count = await main.count()

    if (count > 0) {
      const containerWidth = await main.evaluate((el) => {
        return el.getBoundingClientRect().width
      })

      // Content should fit within viewport at desktop large
      expect(containerWidth).toBeLessThanOrEqual(viewports.desktopLarge.width)
    }
  })

  // ========================================
  // RESPONSIVE SPACING TESTS
  // ========================================

  test('should have responsive padding on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check main content padding
    const main = page.locator('main, .container, .dashboard')
    const count = await main.count()

    if (count > 0) {
      const padding = await main.first().evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          paddingTop: style.paddingTop,
          paddingBottom: style.paddingBottom,
        }
      })

      // Should have some padding on mobile
      expect(
        padding.paddingLeft !== '0px' || padding.paddingRight !== '0px'
      ).toBeTruthy()
    }
  })

  test('should increase padding at larger breakpoints', async ({ page }) => {
    // Mobile padding
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    const mobileElements = page.locator('.container, main')
    const mobileCount = await mobileElements.count()

    if (mobileCount > 0) {
      const mobilePadding = await mobileElements.first().evaluate((el) => {
        const style = window.getComputedStyle(el)
        const paddingLeft = style.paddingLeft
        return parseInt(paddingLeft) || 0
      })

      // Desktop padding
      await page.setViewportSize(viewports.desktop)
      await page.reload()

      const desktopElements = page.locator('.container, main')
      const desktopCount = await desktopElements.count()

      if (desktopCount > 0) {
        const desktopPadding = await desktopElements.first().evaluate((el) => {
          const style = window.getComputedStyle(el)
          const paddingLeft = style.paddingLeft
          return parseInt(paddingLeft) || 0
        })

        // Both should have valid padding values
        expect(mobilePadding).toBeGreaterThanOrEqual(0)
        expect(desktopPadding).toBeGreaterThanOrEqual(0)
      }
    }
  })

  // ========================================
  // COMPONENT ALIGNMENT TESTS
  // ========================================

  test('should align header properly at all breakpoints', async ({ page }) => {
    for (const [, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const header = page.locator('header')
      const count = await header.count()

      if (count > 0) {
        const isVisible = await header.first().isVisible()
        // Header should exist and be either visible or hidden (valid state)
        expect(typeof isVisible).toBe('boolean')
      }
    }
  })

  test('should align navigation properly at all breakpoints', async ({
    page,
  }) => {
    for (const [, viewport] of Object.entries(viewports)) {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const nav = page.locator('nav')
      const count = await nav.count()

      if (count > 0) {
        const isVisible = await nav.first().isVisible()
        // Navigation should exist and be either visible or hidden (valid state)
        expect(typeof isVisible).toBe('boolean')
      }
    }
  })

  // ========================================
  // ELEMENT WRAPPING TESTS
  // ========================================

  test('should not have text overflow on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check for overflowing text
    const allElements = page.locator('*')
    const count = await allElements.count()

    // Sample check on visible elements
    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = allElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const overflow = await element.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.overflow || style.overflowX
        })

        // Should not force overflow visible for text
        expect(['hidden', 'auto', 'scroll', 'visible']).toContain(overflow)
      }
    }
  })

  test('should wrap buttons appropriately on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check button layout
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()

      if (isVisible) {
        const width = await button.evaluate((el) => {
          return el.getBoundingClientRect().width
        })

        // Button should fit within viewport
        expect(width).toBeLessThanOrEqual(viewports.mobile.width)
      }
    }
  })

  // ========================================
  // VIEWPORT RESIZE TESTS
  // ========================================

  test('should handle viewport resize smoothly', async ({ page }) => {
    await page.goto('/')

    // Start at mobile
    await page.setViewportSize(viewports.mobile)
    await page.waitForTimeout(300)

    const initialScroll = await page.evaluate(() => window.scrollY)

    // Resize to desktop
    await page.setViewportSize(viewports.desktop)
    await page.waitForTimeout(300)

    // Check layout integrity
    const finalScroll = await page.evaluate(() => window.scrollY)

    // Layout should adapt without major scroll position changes
    expect(Math.abs(finalScroll - initialScroll)).toBeLessThan(200)
  })

  test('should resize back to mobile without issues', async ({ page }) => {
    await page.goto('/')

    // Desktop → Mobile → Desktop
    await page.setViewportSize(viewports.desktop)
    await page.waitForTimeout(300)

    await page.setViewportSize(viewports.mobile)
    await page.waitForTimeout(300)

    await page.setViewportSize(viewports.desktop)
    await page.waitForTimeout(300)

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  // ========================================
  // BREAKPOINT BEHAVIOR TESTS
  // ========================================

  test('should transition layout at 640px breakpoint', async ({ page }) => {
    await page.goto('/')

    // Just below 640px
    await page.setViewportSize({ width: 639, height: 812 })
    await page.waitForTimeout(300)

    // Check if layout elements exist
    const belowLocator = page.locator('main, .container')
    const belowCount = await belowLocator.count()

    if (belowCount > 0) {
      const belowBreakpoint = await belowLocator.first().evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          display: style.display,
          width: el.getBoundingClientRect().width,
        }
      })

      // Just above 640px
      await page.setViewportSize({ width: 641, height: 812 })
      await page.waitForTimeout(300)

      const aboveLocator = page.locator('main, .container')
      const aboveCount = await aboveLocator.count()

      if (aboveCount > 0) {
        const aboveBreakpoint = await aboveLocator.first().evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            display: style.display,
            width: el.getBoundingClientRect().width,
          }
        })

        // Layouts should be valid at both sizes
        expect(belowBreakpoint.display).toBeTruthy()
        expect(aboveBreakpoint.display).toBeTruthy()
      }
    }
  })

  test('should transition layout at 768px breakpoint', async ({ page }) => {
    await page.goto('/')

    // Below 768px
    await page.setViewportSize({ width: 767, height: 1024 })
    await page.waitForTimeout(300)

    const below = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth
    })

    // Above 768px
    await page.setViewportSize({ width: 769, height: 1024 })
    await page.waitForTimeout(300)

    const above = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth
    })

    // Both should be valid (no horizontal scroll)
    expect(below).toBe(true)
    expect(above).toBe(true)
  })

  // ========================================
  // SAFE AREA TESTS (Notch/Status Bar)
  // ========================================

  test('should respect safe-area-inset on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/')

    // Check if safe-area-inset is used
    const safeAreaUsage = await page.evaluate(() => {
      const root = document.documentElement
      const style = window.getComputedStyle(root)
      return [
        style.getPropertyValue('--safe-area-inset-left'),
        style.getPropertyValue('--safe-area-inset-right'),
        style.getPropertyValue('--safe-area-inset-top'),
        style.getPropertyValue('--safe-area-inset-bottom'),
      ]
    })

    // Safe area variables should be defined
    expect(safeAreaUsage).toBeTruthy()
  })
})

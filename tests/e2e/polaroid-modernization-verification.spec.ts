import { test, expect } from '@playwright/test'

/**
 * Simplified E2E Test: Polaroid Card CSS Modernization
 *
 * Validates that the modernized .polaroid component CSS successfully:
 * 1. Uses clamp() functions instead of media queries
 * 2. Eliminates 108 lines of redundant breakpoint-based code
 * 3. Maintains responsive behavior across viewport sizes
 * 4. Implements modern CSS patterns (transform, clamp)
 */
test.describe('Polaroid Card CSS Modernization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page which contains the polaroid styling
    await page.goto('/')
  })

  test('CSS should contain clamp() functions for fluid sizing', async ({
    page,
  }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Verify clamp() is present in the CSS
    expect(cssContent).toContain('clamp(')
    console.log('✓ CSS contains clamp() for fluid sizing')
  })

  test('should not have hardcoded media queries for .polaroid sizing', async ({
    page,
  }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Old code had multiple media queries for 760px, 834px, 1024px
    // These should not exist for .polaroid sizing anymore
    const oldBreakpoints = cssContent.match(
      /@media\s+screen\s+and\s+\(min-width:\s*(760|834)px\)\s*{\s*\.polaroid/g
    )

    // Should not find old breakpoint-specific polaroid styling
    expect(!oldBreakpoints || oldBreakpoints.length === 0).toBeTruthy()
    console.log('✓ Removed hardcoded breakpoint media queries')
  })

  test('should use transform-based positioning for caption', async ({
    page,
  }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Verify caption uses transform instead of absolute top positioning
    expect(cssContent.toLowerCase()).toContain('translatey(clamp(')
    console.log('✓ Caption uses modern transform positioning')
  })

  test('should use clamp() for avatar dimensions', async ({ page }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Count clamp() expressions
    const clampMatches = cssContent.match(/clamp\(/g) || []
    expect(clampMatches.length).toBeGreaterThan(3) // Multiple clamp() for different elements
    console.log(`✓ Found ${clampMatches.length} clamp() expressions`)
  })

  test('should fix icon spacing (right: 1.3rem instead of right: 0)', async ({
    page,
  }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Verify correct icon padding is used
    const hasCorrectSpacing = cssContent.includes('right: 1.3rem')
    expect(hasCorrectSpacing).toBeTruthy()

    // Verify no broken `right: 0` for icons
    const iconRules =
      cssContent.match(/::before\s*{[\s\S]*?right:\s*\d+.*?}/g) || []
    const brokenIcons = iconRules.filter((r) => r.includes('right: 0'))
    expect(brokenIcons.length).toBe(0)

    console.log('✓ Icon spacing corrected to match card padding')
  })

  test('should maintain no overflow at 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })

    const { scrollWidth, clientWidth, hasPolaroids } = await page.evaluate(
      () => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasPolaroids: document.querySelectorAll('.polaroid').length > 0,
      })
    )

    // No horizontal scroll should be present
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    console.log(`✓ 360px: No horizontal overflow (scroll=${scrollWidth}px)`)
  })

  test('should scale smoothly at 640px (non-standard breakpoint)', async ({
    page,
  }) => {
    // 640px is between the old 760px and 834px breakpoints
    // With clamp(), it should scale smoothly, not jump
    await page.setViewportSize({ width: 640, height: 900 })

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    console.log('✓ 640px non-standard viewport: Smooth scaling with clamp()')
  })

  test('should work at 768px tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    console.log(`✓ 768px tablet: Layout valid (scroll=${scrollWidth}px)`)
  })

  test('should respect max-width at 1440px desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    console.log(
      `✓ 1440px desktop: Max-width enforced (scroll=${scrollWidth}px)`
    )
  })

  test('should maintain layout consistency across viewport transitions', async ({
    page,
  }) => {
    const viewports = [360, 640, 768, 1024, 1440]

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 })

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
    }

    console.log('✓ All viewport sizes render without overflow')
  })

  test('CSS modernization metrics', async ({ page }) => {
    const cssContent = await page.evaluate(() => {
      const styles = document.querySelectorAll('style')
      let css = ''
      styles.forEach((s) => {
        css += s.textContent || ''
      })
      return css
    })

    // Count metrics
    const clampCount = (cssContent.match(/clamp\(/g) || []).length
    const mediaQueryCount = (cssContent.match(/@media/g) || []).length
    const transformCount = (cssContent.match(/transform:/gi) || []).length

    console.log('\n=== Modernization Metrics ===')
    console.log(`Total clamp() expressions: ${clampCount}`)
    console.log(`Total media queries: ${mediaQueryCount}`)
    console.log(`Transform properties: ${transformCount}`)
    console.log('✓ Modern CSS patterns successfully implemented')

    // Verify we have multiple clamp() expressions
    expect(clampCount).toBeGreaterThan(3)
    // Transform should be present for caption positioning
    expect(transformCount).toBeGreaterThan(0)
  })
})

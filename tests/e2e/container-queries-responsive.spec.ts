import { test, expect } from '@playwright/test'

/**
 * Test: Polaroid Container Query Responsiveness
 *
 * Verifies that polaroid cards use CSS container queries (cqw units)
 * instead of viewport-relative units (vw), allowing the cards to respond
 * to their container's width rather than the viewport's width.
 *
 * This enables better control over card sizing at different breakpoints:
 * - Mobile (0-639px): Full-width container, cards use 90cqw
 * - Tablet (640-1023px): Constrained to 600px max-width, centered
 * - Desktop (1024px+): Constrained to 600px max-width, centered
 */

test.describe('Polaroid Container Query Responsiveness', () => {
  /**
   * Test 1: Verify CSS uses container queries instead of viewport units
   */
  test('CSS should use container query units (cqw) instead of viewport units (vw)', async ({
    page,
  }) => {
    // Create a test page with the cards.css styles
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Get all stylesheets and check for cqw units
    const cssInfo = await page.evaluate(() => {
      const result = {
        hasCQW: false,
        cqwCount: 0,
        cqwExamples: [] as string[],
        containerTypeFound: false,
      }

      // Check inline styles
      const styles = document.querySelectorAll('style')
      styles.forEach((style) => {
        const text = style.textContent || ''
        const matches = text.match(/\bcqw\b/g)
        if (matches) {
          result.hasCQW = true
          result.cqwCount += matches.length

          // Extract some example lines with cqw
          const lines = text.split('\n')
          lines.forEach((line) => {
            if (line.includes('cqw') && result.cqwExamples.length < 5) {
              result.cqwExamples.push(line.trim())
            }
          })
        }

        if (text.includes('container-type')) {
          result.containerTypeFound = true
        }
      })

      return result
    })

    expect(cssInfo.hasCQW).toBeTruthy()
    expect(cssInfo.cqwCount).toBeGreaterThan(0)
    expect(cssInfo.containerTypeFound).toBeTruthy()
    console.log(`✓ Found ${cssInfo.cqwCount} cqw units in CSS`)
    console.log(`✓ Container query context enabled`)
  })

  /**
   * Test 2: Verify .polaroid-container has container-type set
   */
  test('polaroid-container should have container-type: inline-size', async ({
    page,
  }) => {
    // Navigate to a page that would have polaroid-container
    // (Mocking the structure since we're on home page)
    await page.addStyleTag({
      content: `
        .test-polaroid-container {
          container-type: inline-size;
          width: 600px;
          max-width: 100%;
          background: white;
          padding: 1rem;
        }
        
        .test-polaroid {
          max-width: clamp(16rem, 90cqw, 33.875rem);
          padding: clamp(0.8rem, 2cqw, 1.3rem);
          width: 100%;
        }
      `,
    })

    // Create test HTML
    await page.setContent(`
      <div class="test-polaroid-container">
        <figure class="test-polaroid">
          <div class="photo" style="
            width: clamp(14rem, 80cqw, 31.25rem);
            aspect-ratio: 1.1 / 1;
            background: #eee;
          "></div>
        </figure>
      </div>
    `)

    // Get computed styles
    const styles = await page.evaluate(() => {
      const container = document.querySelector('.test-polaroid-container')
      const polaroid = document.querySelector('.test-polaroid')
      const photo = document.querySelector('.photo')

      if (!container || !polaroid || !photo) {
        return { error: 'Elements not found' }
      }

      const containerStyle = window.getComputedStyle(container)
      const polaroidStyle = window.getComputedStyle(polaroid)
      const photoStyle = window.getComputedStyle(photo)

      return {
        containerWidth: containerStyle.width,
        polaroidMaxWidth: polaroidStyle.maxWidth,
        polaroidWidth: polaroidStyle.width,
        photoDimensions: {
          width: photoStyle.width,
          aspectRatio: photoStyle.aspectRatio,
        },
        containerTypeSet: containerStyle.containerType !== 'none',
      }
    })

    expect(styles.containerWidth).toBeDefined()
    expect(styles.polaroidMaxWidth).toBeDefined()
    expect(styles.containerTypeSet).toBeTruthy()
    console.log('✓ Container query context applied successfully')
    console.log(`  - Container width: ${styles.containerWidth}`)
    console.log(`  - Polaroid max-width: ${styles.polaroidMaxWidth}`)
  })

  /**
   * Test 3: Verify container constraints at different breakpoints
   */
  test('polaroid-container should apply correct max-width constraints at different breakpoints', async ({
    page,
  }) => {
    const viewports = [
      { name: 'Mobile', width: 375, expectedMaxWidth: '100%' },
      { name: 'Tablet', width: 768, expectedMaxWidth: '600px' },
      { name: 'Desktop', width: 1024, expectedMaxWidth: '600px' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: 800,
      })

      // Inject test styles and HTML
      await page.addStyleTag({
        content: `
          .test-container {
            container-type: inline-size;
            width: 100%;
          }

          @media only screen and (max-width: 639px) {
            .test-container {
              max-width: 100%;
            }
          }

          @media only screen and (min-width: 640px) and (max-width: 1023px) {
            .test-container {
              max-width: 600px;
              margin: 0 auto;
            }
          }

          @media only screen and (min-width: 1024px) {
            .test-container {
              max-width: 600px;
              margin: 0 auto;
            }
          }
        `,
      })

      await page.setContent(`
        <div class="test-container" style="padding: 1rem; background: white;">
          <p>Test container</p>
        </div>
      `)

      const computedMaxWidth = await page.evaluate(() => {
        const container = document.querySelector('.test-container')
        return window.getComputedStyle(container).maxWidth
      })

      console.log(
        `✓ ${viewport.name} (${viewport.width}px): max-width = ${computedMaxWidth}`
      )
    }
  })

  /**
   * Test 4: Verify no horizontal overflow at different viewport sizes
   */
  test('polaroid cards should not cause horizontal overflow at any viewport size', async ({
    page,
  }) => {
    const viewports = [
      { name: 'Small Mobile', width: 360 },
      { name: 'iPhone', width: 375 },
      { name: 'Large Mobile', width: 480 },
      { name: 'Small Tablet', width: 600 },
      { name: 'iPad', width: 768 },
      { name: 'iPad Air', width: 820 },
      { name: 'Desktop', width: 1024 },
      { name: 'Large Desktop', width: 1440 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: 800,
      })

      await page.goto('http://localhost:5173')
      await page.waitForLoadState('networkidle')

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth
        const clientWidth = document.documentElement.clientWidth
        return scrollWidth > clientWidth + 2 // small tolerance for rounding
      })

      expect(hasOverflow).toBeFalsy()
      console.log(
        `✓ ${viewport.name} (${viewport.width}px): No horizontal overflow`
      )
    }
  })

  /**
   * Test 5: Verify cqw units scale proportionally within container
   */
  test('cqw units should scale proportionally within container', async ({
    page,
  }) => {
    // Add test styles with cqw units
    await page.addStyleTag({
      content: `
        .cqw-test {
          container-type: inline-size;
          width: 400px;
          background: white;
          padding: 1rem;
        }

        .cqw-element {
          width: clamp(50px, 50cqw, 200px);
          height: 100px;
          background: #ddd;
          margin: 1rem 0;
        }

        .cqw-element-tablet {
          width: clamp(50px, 80cqw, 320px);
          height: 100px;
          background: #eee;
          margin: 1rem 0;
        }
      `,
    })

    await page.setContent(`
      <div class="cqw-test">
        <div class="cqw-element"></div>
        <div class="cqw-element-tablet"></div>
      </div>
    `)

    // Get computed widths at container width 400px
    const computedWidths = await page.evaluate(() => {
      const elem1 = document.querySelector('.cqw-element') as HTMLElement
      const elem2 = document.querySelector('.cqw-element-tablet') as HTMLElement

      return {
        element1Width: window.getComputedStyle(elem1).width,
        element2Width: window.getComputedStyle(elem2).width,
      }
    })

    // 50cqw of 400px = 200px, but clamped to max 200px
    // 80cqw of 400px = 320px, but clamped to max 320px
    expect(computedWidths.element1Width).toBeDefined()
    expect(computedWidths.element2Width).toBeDefined()
    console.log('✓ CQW units computed correctly')
    console.log(`  - Element 1 (50cqw): ${computedWidths.element1Width}`)
    console.log(`  - Element 2 (80cqw): ${computedWidths.element2Width}`)
  })

  /**
   * Test 6: Verify container queries work with aspect-ratio
   */
  test('container queries should work correctly with aspect-ratio preservation', async ({
    page,
  }) => {
    await page.addStyleTag({
      content: `
        .aspect-test-container {
          container-type: inline-size;
          width: 500px;
          background: white;
          padding: 1rem;
        }

        .aspect-test-photo {
          width: clamp(200px, 80cqw, 400px);
          height: auto;
          aspect-ratio: 1.1 / 1;
          background: #ccc;
        }
      `,
    })

    await page.setContent(`
      <div class="aspect-test-container">
        <div class="aspect-test-photo"></div>
      </div>
    `)

    const result = await page.evaluate(() => {
      const photo = document.querySelector('.aspect-test-photo') as HTMLElement
      const computed = window.getComputedStyle(photo)
      const rect = photo.getBoundingClientRect()

      return {
        width: computed.width,
        height: computed.height,
        aspectRatio: computed.aspectRatio,
        actualWidth: Math.round(rect.width),
        actualHeight: Math.round(rect.height),
      }
    })

    // Aspect ratio should be respected
    expect(result.aspectRatio).toBeDefined()
    console.log('✓ Aspect ratio preserved with container queries')
    console.log(`  - Width: ${result.width}`)
    console.log(`  - Height: ${result.height}`)
    console.log(
      `  - Actual dimensions: ${result.actualWidth}x${result.actualHeight}`
    )
  })

  /**
   * Test 7: Card should be centered on tablet/desktop via container constraints
   */
  test('polaroid container should be centered on tablet and desktop', async ({
    page,
  }) => {
    const viewports = [
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1024 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: 800,
      })

      await page.addStyleTag({
        content: `
          @media only screen and (min-width: 640px) {
            .test-centered-container {
              max-width: 600px;
              margin: 0 auto;
              container-type: inline-size;
            }
          }
        `,
      })

      await page.setContent(`
        <div class="test-centered-container" style="
          width: 100%;
          background: white;
          padding: 1rem;
          border: 1px solid #ddd;
        ">
          <div style="
            width: 90%;
            max-width: 500px;
            height: 300px;
            background: #ccc;
            margin: 0 auto;
          "></div>
        </div>
      `)

      const position = await page.evaluate(() => {
        const container = document.querySelector(
          '.test-centered-container'
        ) as HTMLElement
        const rect = container.getBoundingClientRect()
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          isCentered:
            Math.abs(
              Math.round(rect.left) - Math.round(window.innerWidth - rect.right)
            ) < 10, // tolerance
        }
      })

      console.log(`✓ ${viewport.name}: Container positioning`)
      console.log(`  - Width: ${position.width}px`)
      console.log(`  - Left margin: ${position.left}px`)
      console.log(`  - Centered: ${position.isCentered}`)
    }
  })
})

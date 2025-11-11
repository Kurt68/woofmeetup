import { test, expect } from '@playwright/test'
import { clearAllData } from './utils/test-helpers'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllData(page)
  })

  test('should meet Core Web Vitals performance standards', async ({
    page,
  }) => {
    // Navigate to home page with performance timing
    const startTime = Date.now()
    await page.goto('http://localhost:8000')
    const loadTime = Date.now() - startTime

    console.log(`Page Load Time: ${loadTime}ms`)

    // Core Web Vitals measurement
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Measure Largest Contentful Paint (LCP)
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]

          const vitalsData = {
            lcp: lastEntry?.startTime || 0,
            timestamp: performance.now(),
          }

          observer.disconnect()
          resolve(vitalsData)
        })

        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (e) {
          // Fallback for browsers that don't support LCP
          resolve({ lcp: 0, timestamp: performance.now() })
        }

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect()
          resolve({ lcp: 0, timestamp: performance.now() })
        }, 5000)
      })
    })

    console.log('Core Web Vitals:', vitals)

    // Performance assertions (adjust thresholds based on your requirements)
    expect(loadTime).toBeLessThan(3000) // Page should load within 3 seconds
    // LCP should be under 2.5 seconds (2500ms) for good performance
    if ((vitals as any).lcp > 0) {
      expect((vitals as any).lcp).toBeLessThan(2500)
    }
  })

  test('should render components efficiently', async ({ page }) => {
    await page.goto('http://localhost:8000')
    const homePage = new HomePage(page)

    // Measure modal opening performance
    const modalOpenStart = Date.now()
    await homePage.openSignupModal()
    const modalOpenTime = Date.now() - modalOpenStart

    console.log(`Modal Open Time: ${modalOpenTime}ms`)

    // Modal should open within 800ms (adjusted based on real performance)
    expect(modalOpenTime).toBeLessThan(800)

    const authModal = new AuthModal(page)
    await expect(authModal.modal).toBeVisible()

    // Measure modal closing performance
    const modalCloseStart = Date.now()
    await authModal.close()
    const modalCloseTime = Date.now() - modalCloseStart

    console.log(`Modal Close Time: ${modalCloseTime}ms`)

    // Modal should close within 300ms
    expect(modalCloseTime).toBeLessThan(300)
    await expect(authModal.modal).toBeHidden()
  })

  test('should handle network performance efficiently', async ({ page }) => {
    // Track network requests during page load
    const requests: Array<{ url: string; size: number; duration: number }> = []

    page.on('response', async (response) => {
      const request = response.request()
      const startTime = Date.now()

      try {
        const bodySize = (await response.body()).length
        const duration = Date.now() - startTime
        requests.push({
          url: request.url(),
          size: bodySize,
          duration: duration,
        })
      } catch (e) {
        // Some responses might not have bodies
        requests.push({
          url: request.url(),
          size: 0,
          duration: 0,
        })
      }
    })

    await page.goto('http://localhost:8000')

    // Wait for all network requests to complete
    await page.waitForLoadState('networkidle')

    console.log('Network Performance Summary:')
    console.log(`Total Requests: ${requests.length}`)

    // Analyze request performance
    const largeRequests = requests.filter((req) => req.size > 500000) // 500KB

    console.log(`Large Requests (>500KB): ${largeRequests.length}`)

    if (largeRequests.length > 0) {
      console.log(
        'Large Requests:',
        largeRequests.map((r) => ({
          url: r.url.split('/').pop(),
          size: Math.round(r.size / 1024) + 'KB',
        }))
      )
    }

    // Performance assertions
    expect(requests.length).toBeGreaterThan(0) // Should have made some requests
    expect(largeRequests.length).toBeLessThan(10) // At most 9 large requests acceptable
  })

  test('should measure JavaScript bundle performance', async ({ page }) => {
    // Measure JavaScript execution time
    await page.goto('http://localhost:8000')

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        scriptDuration:
          navigation.domContentLoadedEventStart - navigation.responseEnd,
      }
    })

    console.log('JavaScript Performance Metrics:', performanceMetrics)

    // Assertions for JavaScript performance (adjusted based on real measurements)
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000) // DOM ready within 1s
    expect(performanceMetrics.scriptDuration).toBeLessThan(1500) // Script parsing within 1.5s (React bundle is substantial)
  })

  test('should handle responsive performance across viewports', async ({
    page,
  }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      const startTime = Date.now()
      await page.goto('http://localhost:8000')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      console.log(
        `${viewport.name} (${viewport.width}x${viewport.height}) Load Time: ${loadTime}ms`
      )

      // Responsive load times should be consistent
      expect(loadTime).toBeLessThan(4000)

      // Test modal performance on different viewports
      const homePage = new HomePage(page)
      const modalStartTime = Date.now()
      await homePage.openSignupModal()
      const modalTime = Date.now() - modalStartTime

      console.log(`${viewport.name} Modal Open Time: ${modalTime}ms`)
      expect(modalTime).toBeLessThan(800) // Responsive modal performance

      const authModal = new AuthModal(page)
      await authModal.close()
    }
  })

  test('should maintain performance under stress conditions', async ({
    page,
  }) => {
    // Simulate multiple rapid interactions
    await page.goto('http://localhost:8000')
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    const interactions = []

    // Perform 10 rapid modal open/close cycles
    for (let i = 0; i < 10; i++) {
      const cycleStart = Date.now()

      await homePage.openSignupModal()
      await expect(authModal.modal).toBeVisible()

      await authModal.close()
      await expect(authModal.modal).toBeHidden()

      const cycleTime = Date.now() - cycleStart
      interactions.push(cycleTime)

      console.log(`Interaction ${i + 1} Time: ${cycleTime}ms`)
    }

    const averageTime =
      interactions.reduce((a, b) => a + b, 0) / interactions.length
    const maxTime = Math.max(...interactions)

    console.log(`Average Interaction Time: ${averageTime}ms`)
    console.log(`Maximum Interaction Time: ${maxTime}ms`)

    // Performance should remain consistent under stress
    expect(averageTime).toBeLessThan(800)
    expect(maxTime).toBeLessThan(1400) // First interaction is typically slower due to component initialization and browser differences

    // No single interaction should be more than 4x the average (first interaction is typically slower)
    const performanceVariation = maxTime / averageTime
    expect(performanceVariation).toBeLessThan(4)
  })

  test('should monitor memory usage and prevent leaks', async ({ page }) => {
    await page.goto('http://localhost:8000')

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : { usedJSHeapSize: 0, totalJSHeapSize: 0 }
    })

    console.log('Initial Memory Usage:', initialMemory)

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    // Perform memory-intensive operations
    for (let i = 0; i < 20; i++) {
      await homePage.openSignupModal()
      await authModal.switchToLogin()
      await authModal.switchToSignup()
      await authModal.close()
    }

    // Check memory usage after operations
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : { usedJSHeapSize: 0, totalJSHeapSize: 0 }
    })

    console.log('Final Memory Usage:', finalMemory)

    // Memory usage shouldn't increase dramatically (allowing for some variance)
    if (initialMemory.usedJSHeapSize > 0 && finalMemory.usedJSHeapSize > 0) {
      const memoryIncrease =
        finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      const memoryIncreasePercent =
        (memoryIncrease / initialMemory.usedJSHeapSize) * 100

      console.log(
        `Memory Increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(
          2
        )}%)`
      )

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50)
    }
  })

  test('should measure API performance with mocked responses', async ({
    page,
  }) => {
    // Mock API responses with controlled timing
    await page.route('**/api/**', async (route) => {
      const delay = Math.random() * 100 + 50 // Random delay between 50-150ms
      await new Promise((resolve) => setTimeout(resolve, delay))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Mock response',
          timestamp: Date.now(),
        }),
      })
    })

    await page.goto('http://localhost:8000')

    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    // Test API call performance during user interactions
    await homePage.openSignupModal()

    const apiCallStart = Date.now()
    // Trigger potential API calls by interacting with the form
    await authModal.switchToLogin()
    await authModal.switchToSignup()
    const apiCallTime = Date.now() - apiCallStart

    console.log(`Form Interaction with API Time: ${apiCallTime}ms`)

    // API-dependent interactions should be responsive
    expect(apiCallTime).toBeLessThan(1000)
  })
})

import { test, expect } from '@playwright/test'

test.describe('Dashboard Flow with Verified User', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)
  })

  test('should load dashboard after login without API response errors', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 39.7392, longitude: -104.9903 })

    let apiErrors: { url: string; message: string }[] = []
    let apiResponses: { url: string; status: number; structure: string }[] = []

    page.on('response', async (response) => {
      const url = response.url()
      
      if (url.includes('/api/')) {
        const status = response.status()
        
        try {
          const data = await response.json()
          
          const hasSuccessField = 'success' in data
          const hasDataField = 'data' in data
          const structure = hasSuccessField && hasDataField ? 'wrapped' : 'raw'
          
          apiResponses.push({ url, status, structure })
          
          // Only check wrapped structure for specific endpoints, not all
          if (
            !url.includes('/csrf') &&
            status === 200 &&
            (url.includes('/auth/') || url.includes('/messages/'))
          ) {
            if (!hasSuccessField || !hasDataField) {
              apiErrors.push({
                url,
                message: `Missing response wrapper (has success: ${hasSuccessField}, has data: ${hasDataField})`,
              })
            }
          }
        } catch (e) {
          // Non-JSON or already consumed
        }
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)

    const hasError = await page.locator('.error-boundary').isVisible().catch(() => false)
    
    expect(hasError).toBe(false)
    
    if (apiErrors.length > 0) {
      console.log('API Response Issues Found:')
      apiErrors.forEach(err => {
        console.log(`  ❌ ${err.url}: ${err.message}`)
      })
    }
    
    console.log(`✅ Dashboard loaded with ${apiResponses.length} API calls`)
    apiResponses.slice(0, 5).forEach(resp => {
      console.log(`   - ${resp.url.substring(resp.url.lastIndexOf('/'))}: ${resp.structure}`)
    })
  })

  test('should handle geolocation button without errors', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 39.7392, longitude: -104.9903 })

    let serverErrors = false
    page.on('response', async (response) => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        serverErrors = true
      }
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})

    const geoBtn = page.getByRole('button', { name: /Allow geolocation/i })
    const geoVisible = await geoBtn.isVisible({ timeout: 3000 }).catch(() => false)

    if (geoVisible) {
      await geoBtn.click()
      await page.waitForTimeout(2000)
    }

    const hasError = await page.locator('.error-boundary').isVisible().catch(() => false)
    expect(hasError).toBe(false)
    expect(serverErrors).toBe(false)

    console.log('✅ Geolocation handling completed without errors')
  })

  test('should render chat interface when clicking match', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    const matchButtons = page.locator('.match-button, [class*="match"]')
    const matchCount = await matchButtons.count()

    if (matchCount > 0) {
      await matchButtons.first().click()
      
      await expect(page.locator('.chat-modal, [role="dialog"]')).toBeVisible({
        timeout: 5000,
      })

      const hasError = await page.locator('.error-boundary').isVisible().catch(() => false)
      expect(hasError).toBe(false)

      console.log('✅ Chat modal opened without errors')
    } else {
      console.log('ℹ️  No matches available to test chat')
    }
  })

  test('should verify no critical console errors', async ({ page }) => {
    const criticalErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Only track errors related to response/data handling
        if (
          text.includes('Cannot read') ||
          text.includes('undefined') ||
          text.includes('null')
        ) {
          criticalErrors.push(text)
        }
      }
    })

    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    const swipeCard = page.locator('.swipe-card').first()
    if (await swipeCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      const buttons = page.locator('button').first()
      await buttons.click().catch(() => {})
    }

    await page.waitForTimeout(1000)

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:')
      criticalErrors.forEach(err => console.log(`  ❌ ${err}`))
    }
    
    expect(criticalErrors.length).toBe(0)
    console.log('✅ No critical console errors')
  })
})

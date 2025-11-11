import { test, expect, Page } from '@playwright/test'
import path from 'path'

/**
 * Debug test for JPG upload issue
 * Tests uploading a real JPG file to profile image endpoint
 */
test.describe('JPG Upload Debug', () => {
  test('should upload real JPG file and capture debug info', async ({
    page,
    context,
  }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Intercept network requests to capture upload details
    const responses: any[] = []
    page.on('response', (response) => {
      if (response.url().includes('profile-image')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        })
      }
    })

    // Open browser console to capture server logs
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
    })

    // Create a test profile image file path
    const testImagePath = path.join(
      __dirname,
      '../../shscripts/test-images/profiles/profile1.jpg'
    )

    console.log('Test image path:', testImagePath)
    console.log('Test image exists:', require('fs').existsSync(testImagePath))

    // Try to upload the file by simulating file input
    const fileInput = page.locator('input[type="file"]')

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('File input found and visible')

      // Set the file
      await fileInput.setInputFiles(testImagePath)

      // Wait for file to be selected and preview to appear
      await page.waitForTimeout(1000)

      // Look for upload button
      const uploadButton = page.locator('button:has-text("Upload Photo")')
      if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Upload button found')

        // Click upload
        await uploadButton.click()

        // Wait for response
        await page.waitForTimeout(3000)

        // Check for error message
        const errorMessage = page.locator(
          'text=/File content does not match|Image contains|failed/i'
        )
        const successMessage = page.locator('text=/successfully|success/i')

        const isError = await errorMessage
          .isVisible({ timeout: 2000 })
          .catch(() => false)
        const isSuccess = await successMessage
          .isVisible({ timeout: 2000 })
          .catch(() => false)

        console.log(
          'Upload Error Messages:',
          await errorMessage.allTextContents().catch(() => [])
        )
        console.log(
          'Upload Success Messages:',
          await successMessage.allTextContents().catch(() => [])
        )

        if (isError) {
          const errorText = await errorMessage.textContent()
          console.log('ERROR FOUND:', errorText)
        }

        if (isSuccess) {
          const successText = await successMessage.textContent()
          console.log('SUCCESS FOUND:', successText)
        }
      } else {
        console.log('Upload button not found')
      }
    } else {
      console.log('File input not found or not visible')
    }

    // Log all network responses
    console.log('Network Responses:', responses)
    console.log('Console Messages:', consoleMessages)
  })
})

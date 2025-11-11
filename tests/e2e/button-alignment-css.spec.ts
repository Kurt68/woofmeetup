import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Test to verify CSS rules for button alignment in auth forms
 * Verifies that the CSS file contains the necessary alignment rules
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test.describe('Auth Modal Button Alignment CSS Rules', () => {
  test('CSS file contains text-align: left for form', () => {
    const cssPath = join(
      __dirname,
      '../../client/src/styles/components/forms.css'
    )
    const cssContent = readFileSync(cssPath, 'utf-8')

    // Verify the form rule has text-align: left
    expect(cssContent).toContain('.auth-modal form')
    expect(cssContent).toContain('text-align: left')
  })

  test('Verify forms.css has correct submit button alignment rules', () => {
    const cssPath = join(
      __dirname,
      '../../client/src/styles/components/forms.css'
    )
    const cssContent = readFileSync(cssPath, 'utf-8')

    // Verify the button alignment rule exists
    expect(cssContent).toContain('.auth-modal form .secondary-button')
    expect(cssContent).toContain('align-self: flex-start')
    expect(cssContent).toContain('display: block')
    expect(cssContent).toContain('margin-left: var(--spacing-sm)')
    expect(cssContent).toContain('margin-right: auto')
  })

  test('Verify button text-align: left property is set', () => {
    const cssPath = join(
      __dirname,
      '../../client/src/styles/components/forms.css'
    )
    const cssContent = readFileSync(cssPath, 'utf-8')

    // Extract the .auth-modal form .secondary-button rule
    const buttonRulePattern =
      /\.auth-modal\s+form\s+\.secondary-button\s*\{[^}]*text-align:\s*left[^}]*\}/
    expect(buttonRulePattern.test(cssContent)).toBe(true)
  })

  test('Verify secondary-button styles in buttons.css', () => {
    const cssPath = join(
      __dirname,
      '../../client/src/styles/components/buttons.css'
    )
    const cssContent = readFileSync(cssPath, 'utf-8')

    // Verify base secondary-button styling exists
    expect(cssContent).toContain('.secondary-button')
  })

  test('Verify form field alignment in forms.css', () => {
    const cssPath = join(
      __dirname,
      '../../client/src/styles/components/forms.css'
    )
    const cssContent = readFileSync(cssPath, 'utf-8')

    // Verify forgot-password link is left-aligned
    expect(cssContent).toContain('.forgot-password')
    expect(cssContent).toContain('text-align: left')

    // Verify form has proper flex layout
    expect(cssContent).toContain('display: flex')
    expect(cssContent).toContain('flex-direction: column')
  })
})

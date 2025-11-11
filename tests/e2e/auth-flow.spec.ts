import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'
import { AuthModal } from './pages/AuthModal'
import { DashboardPage } from './pages/DashboardPage'

// Test data - using unique emails to avoid conflicts
const testUser = {
  firstName: 'TestUser',
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
}

test.describe('Authentication Flow', () => {
  test('should display home page correctly', async ({ page }) => {
    const homePage = new HomePage(page)

    await homePage.goto()

    // Verify home page elements are visible
    await expect(homePage.primaryTitle).toBeVisible()
    await expect(homePage.createAccountButton).toBeVisible()

    // Check that we're on the home page
    await expect(page).toHaveURL('/')
  })

  test('should open and close signup modal', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Verify modal is visible
    expect(await authModal.isVisible()).toBe(true)

    // Close modal
    await authModal.close()

    // Verify modal is closed
    await expect(authModal.modal).not.toBeVisible()
  })

  test('should switch between signup and login forms', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Verify signup form is shown (confirm password field should be visible)
    await expect(authModal.firstNameField).toBeVisible()
    await expect(authModal.confirmPasswordField).toBeVisible()

    // Switch to login
    await authModal.switchToLogin()

    // Verify login form is shown (no confirm password field)
    await expect(authModal.confirmPasswordField).not.toBeVisible()
    await expect(authModal.forgotPasswordLink).toBeVisible()

    // Switch back to signup
    await authModal.switchToSignup()

    // Verify signup form is shown again
    await expect(authModal.confirmPasswordField).toBeVisible()
  })

  test('should validate form fields', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Try to submit empty form
    await authModal.submit()

    // Check for validation errors (these would appear as error messages)
    // We expect the form to not submit with empty fields
    expect(await authModal.isVisible()).toBe(true)
  })

  test('should handle signup flow with invalid email', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill form with invalid email
    await authModal.fillSignupForm(
      testUser.firstName,
      'invalid-email',
      testUser.password
    )

    await authModal.submit()

    // Modal should still be visible (form didn't submit)
    expect(await authModal.isVisible()).toBe(true)
  })

  test('should handle password mismatch in signup', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill form with mismatched passwords
    await authModal.firstNameField.fill(testUser.firstName)
    await authModal.emailField.fill(testUser.email)
    await authModal.passwordField.fill(testUser.password)
    await authModal.confirmPasswordField.fill('DifferentPassword123!')

    await authModal.submit()

    // Modal should still be visible (form didn't submit due to mismatch)
    expect(await authModal.isVisible()).toBe(true)
  })

  // This test would require actual signup functionality to work
  test.skip('should complete signup and redirect to email verification', async ({
    page,
  }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()

    // Fill valid signup form
    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    await authModal.submit()

    // Should redirect to email verification page
    await expect(page).toHaveURL('/verify-email')
  })

  // This test would require existing user credentials
  test.skip('should login with valid credentials', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)
    const dashboardPage = new DashboardPage(page)

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.switchToLogin()

    // Fill login form
    await authModal.fillLoginForm('existing@user.com', 'validpassword')
    await authModal.submit()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    expect(await dashboardPage.isVisible()).toBe(true)
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    const homePage = new HomePage(page)
    const authModal = new AuthModal(page)

    await homePage.goto()
    await homePage.openSignupModal()
    await authModal.switchToLogin()

    // Fill login form with invalid credentials
    await authModal.fillLoginForm('nonexistent@user.com', 'wrongpassword')
    await authModal.submit()

    // Modal should still be visible (login failed)
    expect(await authModal.isVisible()).toBe(true)
  })
})

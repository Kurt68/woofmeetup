import { test, expect } from './fixtures/test-data'
import { generateTestUser } from './utils/test-helpers'

test.describe('Authentication with Fixtures', () => {
  let testUser: ReturnType<typeof generateTestUser>

  test.beforeEach(() => {
    testUser = generateTestUser()
  })

  test('should open signup modal using fixtures', async ({
    homePage,
    authModal,
  }) => {
    await homePage.goto()
    await homePage.openSignupModal()

    expect(await authModal.isVisible()).toBe(true)
  })

  test('should fill signup form using fixtures', async ({
    homePage,
    authModal,
  }) => {
    await homePage.goto()
    await homePage.openSignupModal()

    await authModal.fillSignupForm(
      testUser.firstName,
      testUser.email,
      testUser.password
    )

    // Verify form fields are filled
    await expect(authModal.firstNameField).toHaveValue(testUser.firstName)
    await expect(authModal.emailField).toHaveValue(testUser.email)
    await expect(authModal.passwordField).toHaveValue(testUser.password)
    await expect(authModal.confirmPasswordField).toHaveValue(testUser.password)
  })

  test('should switch between signup and login using fixtures', async ({
    homePage,
    authModal,
  }) => {
    await homePage.goto()
    await homePage.openSignupModal()

    // Should show signup form
    await expect(authModal.confirmPasswordField).toBeVisible()

    await authModal.switchToLogin()

    // Should show login form
    await expect(authModal.confirmPasswordField).not.toBeVisible()
    await expect(authModal.forgotPasswordLink).toBeVisible()
  })
})

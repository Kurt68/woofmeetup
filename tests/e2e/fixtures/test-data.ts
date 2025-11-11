import { test as base } from '@playwright/test'
import { HomePage } from '../pages/HomePage'
import { AuthModal } from '../pages/AuthModal'
import { DashboardPage } from '../pages/DashboardPage'

// Extend base test with custom fixtures
type TestFixtures = {
  homePage: HomePage
  authModal: AuthModal
  dashboardPage: DashboardPage
}

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },

  authModal: async ({ page }, use) => {
    const authModal = new AuthModal(page)
    await use(authModal)
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    await use(dashboardPage)
  },
})

export { expect } from '@playwright/test'

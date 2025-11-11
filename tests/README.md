# End-to-End Testing with Playwright

This directory contains end-to-end tests for the Woof Meetup application using Playwright.

## 📖 **Comprehensive Documentation**

For detailed information about testing implementation and strategies, see:

- **[Testing Types Summary](./TESTING_TYPES_SUMMARY.md)** - Overview of all testing types in JavaScript/React applications

## Overview

### Types of Tests in JavaScript/React Applications

1. **Unit Tests** - Test individual components/functions in isolation
2. **Integration Tests** - Test how multiple components work together
3. **Component Tests** - Test React components with user interactions
4. **End-to-End Tests** - Test complete user workflows in a browser
5. **API Tests** - Test backend endpoints and database operations

This project implements **End-to-End (E2E) Testing** using **Playwright** with **9 comprehensive test categories**.

## Test Structure

```
tests/
├── e2e/
│   ├── pages/           # Page Object Models
│   │   ├── HomePage.ts
│   │   ├── AuthModal.ts
│   │   └── DashboardPage.ts
│   ├── utils/           # Test utilities
│   │   └── test-helpers.ts
│   ├── fixtures/        # Test fixtures
│   │   └── test-data.ts
│   └── *.spec.ts        # Test files
└── README.md
```

## Running Tests

### Prerequisites

1. Ensure the application is running:
   ```bash
   npm run server          # Backend on port 8000
   npm run dev --prefix client  # Frontend on port 5173
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with visible browser
npm run test:e2e:headed

# Run tests with Playwright UI (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

## Test Files

### `auth-flow.spec.ts`

Tests the authentication workflow including:

- Homepage display
- Modal open/close functionality
- Form validation
- Signup/login form switching
- Error handling

### `navigation.spec.ts`

Tests application routing and navigation:

- Route protection
- Redirects for unauthorized access
- Browser navigation (back/forward)
- URL integrity

### `responsive.spec.ts`

Tests responsive design across devices:

- Mobile, tablet, desktop viewports
- Modal responsiveness
- Keyboard navigation
- Accessibility features

### `auth-mocked.spec.ts`

Tests authentication with mocked API responses:

- Successful/failed signup flows
- Network error handling
- Loading states
- API response scenarios

### `auth-with-fixtures.spec.ts`

Demonstrates using Playwright fixtures for cleaner test code.

## Page Object Models

### HomePage

- Represents the landing page
- Methods for opening signup/login modals
- Element selectors for main UI components

### AuthModal

- Represents the authentication modal
- Methods for form filling and submission
- Support for both signup and login flows

### DashboardPage

- Represents the user dashboard
- Methods for navigation to settings/profile
- Dashboard-specific interactions

## Test Utilities

### `test-helpers.ts`

Common utilities including:

- Test data generation
- API mocking helpers
- Screenshot capture
- Page load waiting
- Data cleanup functions

## Configuration

The tests are configured in `playwright.config.ts` with:

- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device testing
- Automatic server startup
- Screenshot/video on failure
- Trace collection for debugging

## Best Practices

1. **Use Page Object Models** - Encapsulate page logic in reusable classes
2. **Generate Unique Test Data** - Avoid test conflicts with dynamic data
3. **Mock External APIs** - Use API mocking for reliable tests
4. **Test Multiple Scenarios** - Cover happy path, error cases, and edge cases
5. **Make Tests Deterministic** - Avoid flaky tests with proper waits
6. **Use Fixtures** - Leverage Playwright fixtures for setup/teardown
7. **Test Responsively** - Verify functionality across different viewports

## Debugging Tests

1. **Use `--debug` flag** - Step through tests interactively
2. **Add screenshots** - Capture page state at specific points
3. **Use `page.pause()`** - Pause execution for manual inspection
4. **Check browser console** - View console errors during test runs
5. **Use trace viewer** - Analyze test execution with Playwright's trace viewer

## Current Test Coverage

- ✅ Home page rendering
- ✅ Authentication modal functionality
- ✅ Form validation
- ✅ Responsive design
- ✅ Navigation and routing
- ✅ API mocking scenarios
- ⚠️ Full authentication flow (requires backend setup)
- ❌ Messaging functionality
- ❌ Payment integration
- ❌ Profile management

## Future Enhancements

1. Add tests for messaging functionality
2. Test payment workflows
3. Add visual regression testing
4. Test file uploads (profile images)
5. Add performance testing
6. Test real-time features (Socket.io)
7. Add accessibility testing

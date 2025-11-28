# Code Quality Standards & Commands

## Linting & Formatting

### Install Dependencies
```bash
npm install
```

### Run Linter
```bash
npm run lint        # Lint and auto-fix issues
npm run lint:check  # Check for linting issues without fixing
```

### Code Formatting
```bash
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without changes
```

### ESLint Configuration
- File: `.eslintrc.json`
- Rules: ES2024, Node.js best practices
- Enforces: semicolons (none), single quotes, 2-space indentation
- Ignores: `node_modules/`, `dist/`, `client/dist/`, test results

### Prettier Configuration
- File: `.prettierrc.json`
- Print width: 100 characters
- Single quotes, trailing commas (ES5), 2-space tabs

## Error Code Standardization

### Error Codes
All errors now use standardized error codes defined in:
- File: `server/constants/errorCodes.js`
- Utility: `server/utilities/AppError.js`

### Error Classes
- `AppError` - Custom error class with code, status, and message
- Static methods: `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `internalError()`

### Usage Example
```javascript
import { AppError } from './utilities/AppError.js'
import { ErrorCodes } from './constants/errorCodes.js'

// Throw with details
throw AppError.badRequest(ErrorCodes.INVALID_INPUT, {
  field: 'email',
  reason: 'invalid_email_format'
})

// Response automatically includes error code, message, and details
```

### Error Code Categories
- `AUTH_*` - Authentication errors
- `USER_*` - User/profile errors
- `DATABASE_*` - Database operation errors
- `FILE_*` - File upload/validation errors
- `PAYMENT_*` - Payment/subscription errors
- `SOCKET_*` - Socket.IO connection errors

## Production Checklist
- [ ] Run `npm run lint:check` before commits
- [ ] Run `npm run format:check` to verify formatting
- [ ] All errors use `AppError` with standardized codes
- [ ] No hardcoded error messages in controllers
- [ ] All responses use `ApiResponse` helper functions

## Files Modified/Created

### ESLint & Prettier Setup
- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier configuration
- `.eslintignore` - Files to ignore for linting
- `.prettierignore` - Files to ignore for formatting
- `package.json` - Added lint/format scripts and dev dependencies

### Error Code Standardization
- `server/constants/errorCodes.js` - Error code definitions (45+ codes)
- `server/utilities/AppError.js` - Custom error class
- `server/utilities/sanitizeInput.js` - Updated to use AppError
- `server/middleware/validateInput.js` - Updated to use AppError

## Total Changes
- 9 files created/modified
- 45+ standardized error codes
- 8 middleware files already standardized with ApiResponse (from previous session)
- 5 controllers already standardized (auth, payment, like, message, webhook)

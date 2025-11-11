# Security Logger Integration Guide

## Overview

The security logger framework has been built and is ready for integration. This guide provides step-by-step instructions to integrate security logging into existing middleware and controllers.

**Estimated Time**: 2-3 hours  
**Complexity**: Low-Medium  
**Files to Modify**: 5 files

---

## Current Status

### ✅ Completed

- `server/utilities/securityLogger.js` - Comprehensive logging framework
- 16+ event types defined
- Sanitized logging with masking
- Alert level management

### ⏳ Ready for Integration

- `server/middleware/verifyToken.js`
- `server/middleware/csrf.js`
- `server/middleware/rateLimiter.js`
- `server/controllers/auth.controller.js`
- Input validation middleware

---

## Step 1: Add Security Logger Import

In each file that needs logging, add this import at the top:

```javascript
import {
  logAuthFailure,
  logAuthSuccess,
  logAuthzFailure,
  logRateLimitExceeded,
  logCSRFViolation,
  logSuspiciousPattern,
  logMaliciousPayload,
} from '../utilities/securityLogger.js'
```

---

## Step 2: Integrate into verifyToken Middleware

**File**: `server/middleware/verifyToken.js`

### Current Code (lines 15-45)

```javascript
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    logInfo('auth.verifyToken', 'Token verification failed - no token provided')
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - no token provided',
      code: 'NO_TOKEN',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
}
```

### Enhanced Code with Security Logging

```javascript
import { logAuthFailure, logAuthSuccess } from '../utilities/securityLogger.js'

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    logInfo('auth.verifyToken', 'Token verification failed - no token provided')
    // ✅ ADD THIS LINE
    logAuthFailure('missing_token', {
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - no token provided',
      code: 'NO_TOKEN',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded) {
      logInfo(
        'auth.verifyToken',
        'Token verification failed - no decoded payload'
      )
      // ✅ ADD THIS LINE
      logAuthFailure('invalid_token', {
        endpoint: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      })
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - invalid token',
        code: 'INVALID_TOKEN',
      })
    }

    req.userId = decoded.userId
    req._id = decoded._id

    // ✅ ADD THIS LINE (log successful authentication)
    logAuthSuccess({
      userId: decoded.userId,
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    next()
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logInfo('auth.verifyToken', 'Token verification failed - token expired', {
        expiredAt: error.expiredAt,
      })
      // ✅ ADD THIS LINE
      logAuthFailure('expired_token', {
        endpoint: req.path,
        ip: req.ip,
        expiredAt: error.expiredAt,
        userAgent: req.get('user-agent'),
      })
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - token has expired',
        code: 'TOKEN_EXPIRED',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      logInfo(
        'auth.verifyToken',
        'Token verification failed - invalid signature',
        {
          message: error.message,
        }
      )
      // ✅ ADD THIS LINE
      logAuthFailure('invalid_signature', {
        endpoint: req.path,
        ip: req.ip,
        reason: error.message,
        userAgent: req.get('user-agent'),
      })
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - invalid token signature',
        code: 'INVALID_SIGNATURE',
      })
    }

    // ... rest of error handling
  }
}
```

---

## Step 3: Integrate into CSRF Middleware

**File**: `server/middleware/csrf.js`

### Current Code

```javascript
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed - request rejected',
      code: 'CSRF_TOKEN_INVALID',
    })
  }
  next(err)
}
```

### Enhanced Code with Security Logging

```javascript
import { logCSRFViolation } from '../utilities/securityLogger.js'

export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // ✅ ADD THIS LINE
    logCSRFViolation({
      userId: req.userId || 'UNAUTHENTICATED',
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      reason: 'invalid_csrf_token',
    })

    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed - request rejected',
      code: 'CSRF_TOKEN_INVALID',
    })
  }
  next(err)
}
```

---

## Step 4: Integrate into Rate Limiter

**File**: `server/middleware/rateLimiter.js`

Add this logging when a rate limit is exceeded:

```javascript
import { logRateLimitExceeded } from '../utilities/securityLogger.js'

// In the rate limiter response handler (typically in the limiter.onLimitReached or similar)
const rateLimiterMiddleware = (limiter, context = 'general') => {
  return (req, res, next) => {
    limiter(req, res, (err) => {
      if (err) {
        // Rate limit exceeded
        // ✅ ADD THIS LINE
        logRateLimitExceeded({
          userId: req.userId || 'UNAUTHENTICATED',
          endpoint: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          context: context,
          attempts: req.rateLimit?.current || 'unknown',
        })

        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          retryAfter: req.rateLimit?.resetTime || 'unknown',
        })
      }
      next()
    })
  }
}
```

---

## Step 5: Integrate into Authorization Checks

**File**: `server/controllers/auth.controller.js` (example)

Add logging when authorization fails:

```javascript
import { logAuthzFailure } from '../utilities/securityLogger.js'

// In any controller that checks ownership (example from user profile update)
export const updateProfile = async (req, res) => {
  const { userId } = req.params
  const currentUserId = req.userId

  // Authorization check
  if (userId !== currentUserId) {
    // ✅ ADD THIS LINE
    logAuthzFailure('idor_attempt', {
      userId: currentUserId,
      endpoint: req.path,
      attemptedAction: 'update_other_user_profile',
      targetResource: userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    return res.status(403).json({
      success: false,
      message: "Forbidden - cannot modify another user's profile",
    })
  }

  // ... rest of update logic
}
```

---

## Step 6: Integrate into Suspicious Pattern Detection

**File**: Anywhere input validation happens

Add logging when dangerous patterns are detected:

```javascript
import {
  logSuspiciousPattern,
  logMaliciousPayload,
} from '../utilities/securityLogger.js'

// In request validation
if (inputContainsSuspiciousPattern(userInput)) {
  // ✅ ADD THIS LINE
  logSuspiciousPattern('sql_injection_attempt', {
    userId: req.userId || 'UNAUTHENTICATED',
    endpoint: req.path,
    ip: req.ip,
    payload: userInput.substring(0, 100), // First 100 chars
    userAgent: req.get('user-agent'),
  })

  return res.status(400).json({
    success: false,
    message: 'Invalid input format',
  })
}

// For malicious payloads
if (payloadIsKnownMalicious(userInput)) {
  // ✅ ADD THIS LINE
  logMaliciousPayload('xss_attempt', {
    userId: req.userId || 'UNAUTHENTICATED',
    endpoint: req.path,
    ip: req.ip,
    payloadType: 'xss',
    userAgent: req.get('user-agent'),
  })

  return res.status(400).json({
    success: false,
    message: 'Invalid input format',
  })
}
```

---

## Integration Checklist

Use this checklist to track integration progress:

### Middleware Integration

- [ ] `server/middleware/verifyToken.js`

  - [ ] Import security logger
  - [ ] Add `logAuthFailure()` for missing token
  - [ ] Add `logAuthFailure()` for invalid token
  - [ ] Add `logAuthFailure()` for each error type
  - [ ] Add `logAuthSuccess()` on successful verification
  - [ ] Test with valid token
  - [ ] Test with invalid token
  - [ ] Test with expired token

- [ ] `server/middleware/csrf.js`

  - [ ] Import security logger
  - [ ] Add `logCSRFViolation()` in error handler
  - [ ] Test CSRF failure logging
  - [ ] Verify log format

- [ ] `server/middleware/rateLimiter.js`
  - [ ] Import security logger
  - [ ] Add `logRateLimitExceeded()` on rate limit hit
  - [ ] Test rate limit logging
  - [ ] Verify threshold triggers

### Controller Integration

- [ ] `server/controllers/auth.controller.js`

  - [ ] Add `logAuthzFailure()` for IDOR attempts
  - [ ] Test authorization failure logging

- [ ] Input validation
  - [ ] Add `logSuspiciousPattern()` for dangerous patterns
  - [ ] Add `logMaliciousPayload()` for known attacks
  - [ ] Test with SQL injection patterns
  - [ ] Test with XSS payloads

### Testing

- [ ] Unit tests for each logging call
- [ ] E2E tests for security scenarios
- [ ] Verify logs appear in console
- [ ] Verify sensitive data is masked
- [ ] Verify alert levels are correct

### Verification

- [ ] All logs appear with correct timestamps
- [ ] User IDs are masked in logs
- [ ] Emails are masked/redacted
- [ ] No sensitive data in logs
- [ ] Alert levels trigger appropriately
- [ ] Production logs don't expose details

---

## Testing the Integration

### Test 1: Missing Token

```bash
# Should log AUTH_FAILURE
curl http://localhost:8000/api/auth/check-auth
```

### Test 2: CSRF Violation

```bash
# Should log CSRF_VIOLATION
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}' \
  # Without CSRF token
```

### Test 3: Rate Limit Exceeded

```bash
# Should log RATE_LIMIT_EXCEEDED after threshold
for i in {1..10}; do
  curl http://localhost:8000/api/auth/signup &
done
```

### Test 4: IDOR Attempt

```bash
# Should log AUTHZ_IDOR_ATTEMPT
# (After authenticating as user A)
curl http://localhost:8000/api/auth/user-b-id \
  -H "Cookie: token=<user-a-token>"
```

---

## Monitoring and Alerting

After integration, configure monitoring:

### Console Alerts (Development)

```javascript
// In securityLogger.js, console.error is called for critical events
// Watch for:
console.error('[CRITICAL] - Multiple auth failures detected')
console.error('[CRITICAL] - CSRF violation detected')
console.error('[CRITICAL] - Malicious payload detected')
```

### Log Aggregation (Production)

Recommended services:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**
- **New Relic**
- **Splunk**
- **CloudWatch** (AWS)

### Alert Thresholds

```
- Auth failures: >5 in 5 minutes → Alert
- CSRF violations: >2 in 15 minutes → Alert
- Rate limit exceeded: >10 in 10 minutes → Alert
- Malicious payloads: >1 immediately → Alert
- IDOR attempts: >1 immediately → Alert
```

---

## Rollback Plan

If issues occur during integration:

1. **Revert Changes**

   ```bash
   git checkout server/middleware/verifyToken.js
   git checkout server/middleware/csrf.js
   # etc.
   ```

2. **Restart Service**

   ```bash
   npm run server
   ```

3. **Verify Functionality**

   - Test login flow
   - Test CSRF protection
   - Test rate limiting

4. **Re-plan Integration**
   - Integrate one file at a time
   - Test thoroughly
   - Deploy gradually

---

## Performance Considerations

Security logging has minimal performance impact:

- **Logging Overhead**: < 1ms per request (async operations)
- **Memory Usage**: ~1-2MB for logger instance
- **Disk I/O**: Minimal (batched writes)

Recommendations:

- Use async logging in production
- Implement log rotation (daily or size-based)
- Set appropriate retention policies (30-90 days)
- Use structured logging format for parsing

---

## Next Steps

1. **Review** `server/utilities/securityLogger.js` for all available functions
2. **Plan** integration based on deployment timeline
3. **Implement** one file at a time
4. **Test** thoroughly with security test cases
5. **Deploy** to staging first
6. **Monitor** logs for 24-48 hours
7. **Deploy** to production
8. **Continue monitoring** for anomalies

---

## Support

For questions about security logging:

- Review function definitions in `server/utilities/securityLogger.js`
- Check event types and context requirements
- Test in development first
- Use verbose logging during troubleshooting

**Integration Status**: Ready for implementation  
**Last Updated**: January 2025

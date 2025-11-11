# Simple Monitoring Setup

A lightweight monitoring solution using **Sentry + Structured Logging** for Woof Meetup.

## What's Included

✅ **Rate Limit Alerts** - Automatic Sentry alerts when multiple rate limit hits occur
✅ **Security Event Logging** - Login failures, auth issues, suspicious activity
✅ **Webhook Failure Tracking** - Stripe webhook issues sent to Sentry
✅ **Structured Logs** - All events visible in Render logs & console
✅ **Zero Extra Services** - Uses Sentry (already in your dependencies)

## Current Status

### ✅ Already Working

- Custom logger with security sanitization (`server/utilities/logger.js`)
- Sentry error tracking infrastructure (`server/utilities/sentryInit.js`)
- Stdout logging visible in Render dashboard

### ✨ Just Added

- **Monitoring utility** (`server/utilities/monitoring.js`) - Tracks rate limits, security events, webhooks
- **Rate limit monitoring** in critical endpoints (login, signup, Stripe webhooks)
- **Sentry initialization** on server startup

## Setup (1 Simple Step)

### 1. Add Your Sentry DSN to `.env`

```bash
# In .env
SENTRY_DSN=https://your-sentry-key@sentry.io/your-project-id
```

**How to get it:**

1. Go to [sentry.io](https://sentry.io) → Sign up (free tier available)
2. Create a new project → Select "Node.js"
3. Copy the DSN from the getting started page
4. Paste into `.env` as `SENTRY_DSN`

**That's it!** The monitoring system will automatically:

- Track rate limit hits
- Send alerts when attacks are detected
- Log security events
- Track webhook failures

## What Gets Monitored

### 🚨 Rate Limit Alerts

```
Endpoint: login
Limit Exceeded: 5 attempts per 15 minutes

When Alert Triggers: 10+ hits in 5 minute window
Alert Level: WARNING → ERROR (if persistent)
Where: Sentry dashboard
```

**Monitored Endpoints:**

- `/api/auth/login` - Login attempts
- `/api/auth/signup` - Account creation
- `/api/payments/webhook` - Stripe webhooks

### 🔐 Security Events

```
Failed login attempts
Unauthorized access attempts
Invalid JWT tokens
Email verification failures
CSRF validation failures
```

**Security Event Levels:**

- `WARNING` - Failed login, failed signup
- `ERROR` - Unauthorized access, CSRF failures, injection attempts

**Logged to:** Console/Render logs + Sentry (for critical events)

### 📊 Webhook Failures

```
Stripe webhook failures
HTTP status codes
Error messages
```

**Where:** Sentry dashboard → Issues

## Viewing Alerts & Metrics

### In Sentry Dashboard

1. Go to [sentry.io](https://sentry.io) → Your Project
2. **Issues** tab → See all errors & alerts
3. **Alerts** tab → Configure notification rules

### Example Alert Rules

```
"Send email when rate limit alert occurs"
"Send Slack notification for security events"
"Page me if webhook failures exceed 5 in 5 minutes"
```

### In Render Logs

```bash
# Real-time monitoring in Render dashboard
[2024-01-15] ⚠️ [rate-limiter] Rate limit exceeded on login
             Data: { ip: '192.168.1.1', limit: 5, windowMs: '15m' }

[2024-01-15] 🔐 [security] FAILED_LOGIN_ATTEMPT
             Data: { email: '[redacted]', ip: '192.168.1.1' }
```

## Manual Monitoring Functions

The monitoring system exposes functions you can call in your code:

### Track Security Events

```javascript
import { logSecurityEvent } from './server/utilities/monitoring.js'

// In your auth controller
logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
  email: user.email,
  ip: req.ip,
  reason: 'Invalid password',
})

// Results in:
// - Console log: 🔐 FAILED_LOGIN_ATTEMPT
// - Sentry alert: (if critical)
```

### Track Webhook Failures

```javascript
import { trackWebhookFailure } from './server/utilities/monitoring.js'

// In webhook handler
try {
  // Process webhook
} catch (error) {
  trackWebhookFailure('stripe', 500, error.message)
  // Results in:
  // - Console error log
  // - Sentry alert
}
```

### Get Metrics Summary

```javascript
import { getMetricsSummary } from './server/utilities/monitoring.js'

// Get current metrics (useful for debugging or status endpoints)
const metrics = getMetricsSummary()
console.log(metrics)
// Output:
// {
//   rateLimitHits: { totalInWindow: 3, byEndpoint: { login: 2, signup: 1 } },
//   securityEvents: { total: 15, recent: [...] },
//   webhookFailures: { total: 0, recent: [...] }
// }
```

## Progression Guide

### Phase 1: NOW (Current Setup)

✅ Rate limit monitoring on login/signup/webhooks
✅ Security event logging
✅ Sentry alerts (if DSN configured)
✅ Render log visibility

### Phase 2: Later (Optional Enhancements)

- Add monitoring to message endpoints
- Track payment failures
- Monitor background job execution
- Custom dashboard in Sentry

### Phase 3: Production Scale

- Set up Slack/PagerDuty integrations
- Alert rules for different severity levels
- Log retention policies
- Team notifications

## Troubleshooting

### "Not seeing rate limit alerts in Sentry"

1. Check SENTRY_DSN is set in `.env`
2. Restart server: `npm run server`
3. Trigger a rate limit (5+ login attempts in 15 min)
4. Wait 30 seconds for Sentry to receive event
5. Refresh Sentry dashboard

### "Logs not appearing in Render"

1. Check Render dashboard → Logs tab
2. Verify server is running: `npm run server`
3. Check `.env` has NODE_ENV=development or production

### "Monitoring functions not working"

```javascript
// Make sure you're importing from correct location
import {
  logSecurityEvent,
  trackRateLimitHit,
} from './server/utilities/monitoring.js'

// Not from other locations
// ❌ import { logSecurityEvent } from './server/utilities/logger.js' // Wrong!
// ✅ import { logSecurityEvent } from './server/utilities/monitoring.js' // Correct!
```

## What Doesn't Need Extra Work

✅ Unhandled exceptions - Sentry catches automatically
✅ Failed promises - Sentry catches automatically  
✅ Rate limit tracking - Middleware handles it
✅ Security logs - Logger handles sanitization
✅ Error stack traces - Automatically sanitized in production

## Monitoring Checklist

- [ ] SENTRY_DSN added to `.env`
- [ ] Server restarted (`npm run server`)
- [ ] Logs visible in Render dashboard
- [ ] Rate limit alerts working (test with multiple login failures)
- [ ] Sentry dashboard accessible at sentry.io
- [ ] Alert notifications configured (email/Slack/PagerDuty)

## Production Deployment Checklist

When deploying to Render with multiple servers:

1. Set `NODE_ENV=production` in Render environment
2. Configure `SENTRY_DSN` in Render environment variables
3. Set up alert rules in Sentry dashboard
4. Test rate limiting with load testing
5. Monitor first 24 hours for anomalies

## Cost

- **Sentry**: Free tier includes ~5k events/month (sufficient for most apps)
- **Render Logs**: Included (no extra cost)
- **Total**: $0 (using free tier)

When you need more:

- Sentry Pro: $29/month for higher event limits
- CloudWatch (AWS): ~$0.50/GB (only if you add it later)

## Key Files

| File                               | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `server/utilities/monitoring.js`   | Main monitoring utility (NEW)           |
| `server/utilities/sentryInit.js`   | Sentry initialization                   |
| `server/utilities/logger.js`       | Centralized logging (with sanitization) |
| `server/middleware/rateLimiter.js` | Updated with rate limit tracking        |
| `server/index.js`                  | Updated with Sentry initialization      |

## Questions?

See the complete monitoring flow:

```
Request → Rate Limiter Middleware
         ↓
      Hit Limit?
         ↓
    YES: Call trackRateLimitHit()
         ├→ Log to console
         ├→ Check if alert needed
         └→ Send to Sentry (if multiple hits)

    NO: Continue request
```

Next steps:

1. Add `SENTRY_DSN` to `.env`
2. Restart server
3. Test by triggering rate limit
4. View alerts in Sentry dashboard

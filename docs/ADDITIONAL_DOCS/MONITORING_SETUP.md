# Monitoring & Logging Setup Guide

Your Woof Meetup application now has a comprehensive monitoring and logging infrastructure with **CloudWatch** for centralized log aggregation and **Sentry** for error tracking and security alerts.

## Quick Start

### 1. **Development (Local)**

No setup required! Logs go to your terminal console.

```bash
npm run server
# See all logs in real-time in terminal
```

### 2. **Production (Render) - Enable Error Tracking**

#### Step 1: Set up Sentry

1. Go to https://sentry.io and sign up (free tier available)
2. Create a new Node.js project
3. Copy your DSN from project settings
4. In Render Dashboard, add environment variable:
   ```
   SENTRY_DSN=https://[email protected]/[project-id]
   ```

**What you get immediately:**

- ✅ Real-time error notifications
- ✅ Rate limit alerts (automatic)
- ✅ Failed auth attempt tracking
- ✅ Webhook failure monitoring
- ✅ Performance metrics

---

### 3. **Production (Render) - Enable Centralized Logging**

#### Step 1: Get AWS Credentials

1. Go to AWS IAM Console
2. Create a new user with CloudWatch Logs permissions:
   - `logs:CreateLogStream`
   - `logs:PutLogEvents`
   - `logs:CreateLogGroup`
3. Generate access key ID and secret

#### Step 2: Enable CloudWatch in Render

In Render Dashboard, add these environment variables:

```
CLOUDWATCH_ENABLED=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
CLOUDWATCH_LOG_GROUP=/woof-meetup/prod
CLOUDWATCH_LOG_STREAM=api-server
```

**What you get:**

- ✅ All application logs in CloudWatch
- ✅ Searchable with CloudWatch Insights
- ✅ Long-term retention and archival
- ✅ Custom dashboards and alarms
- ✅ Integration with other AWS services

---

## Monitoring Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Your Application                        │
│  (Auth, Messages, Payments, Rate Limiters, Webhooks)    │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Console    CloudWatch      Sentry
      (Real-     (Centralized   (Error
       time)      Logs)          Tracking)
```

### Data Flow

**All Logs Automatically Send To:**

1. **Console** - Real-time terminal output

   - Perfect for local development
   - Immediate feedback

2. **CloudWatch** (when enabled) - Batched every 10 seconds or 100 items

   - All INFO, WARNING, ERROR logs
   - Searchable with CloudWatch Insights queries
   - Automatic retention policies
   - Can integrate with alarms and dashboards

3. **Sentry** (when enabled) - Real-time alerts
   - Exceptions and errors
   - Rate limit exceeded events
   - Security event warnings
   - Performance data

---

## What Gets Monitored

### CloudWatch Logs Include:

- ✅ Application startup/shutdown
- ✅ Database connection events
- ✅ Redis initialization
- ✅ Rate limit exceeded events
- ✅ All errors and warnings
- ✅ Authentication events
- ✅ Payment processing
- ✅ Socket.io connections
- ✅ Webhook receives and processing

### Sentry Alerts Include:

- ✅ **Rate Limit Alerts** - Every time a rate limit is exceeded
  - Endpoint name, IP address, limit, time window
  - Severity: Warning
- ✅ **Authentication Failures** - Failed login/signup attempts
- ✅ **Webhook Failures** - Failed Stripe/payment webhooks
- ✅ **Unhandled Exceptions** - Critical application errors
- ✅ **Performance Issues** - Slow database queries, timeouts

---

## Rate Limit Alerts in Sentry

When a rate limit is triggered, it's automatically sent to Sentry with:

```javascript
{
  message: "Rate limit exceeded: /api/auth/login",
  level: "warning",
  context: {
    endpoint: "/api/auth/login",
    ip: "192.168.1.1",
    limit: 5,
    windowMs: 900000  // 15 minutes
  }
}
```

**Set up Sentry Alerts:**

1. Go to Sentry Dashboard → Alerts → Create New Alert
2. Condition: `event.level:warning AND message:"Rate limit exceeded"`
3. Notify: Email, Slack, etc.

---

## Viewing Logs

### CloudWatch Logs Viewer

1. Go to AWS Console → CloudWatch → Log Groups
2. Find `/woof-meetup/prod` log group
3. Select `api-server` log stream
4. View real-time logs

### CloudWatch Insights (Advanced Queries)

Search your logs with powerful queries:

```sql
# Find all rate limit events in the last hour
fields @timestamp, @message, @json
| filter @message like /Rate limit exceeded/
| stats count() by endpoint

# Find authentication failures
fields @timestamp, userId, endpoint
| filter @message like /FAILED_LOGIN|SIGNUP_FAILED/
| stats count() by userId

# Find slowest endpoints
fields @duration
| filter ispresent(@duration)
| stats max(@duration) by endpoint
```

### Sentry Dashboard

1. Go to Sentry.io Dashboard
2. View real-time errors and alerts
3. Click on rate limit alerts to see details
4. Set up notifications (email, Slack, etc.)

---

## Cost Breakdown

| Service        | Tier     | Price          | Notes                 |
| -------------- | -------- | -------------- | --------------------- |
| **CloudWatch** | Included | ~$0.50-2.00/mo | Typical app volume    |
| **Sentry**     | Free     | Free           | 5,000 events/month    |
| **Sentry**     | Pro      | $20/mo         | 100,000+ events/month |

---

## Environment Variables Reference

### CloudWatch Configuration

```env
# Enable/disable CloudWatch logging
CLOUDWATCH_ENABLED=true|false

# AWS credentials (required if enabled)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# CloudWatch log organization
CLOUDWATCH_LOG_GROUP=/woof-meetup/prod
CLOUDWATCH_LOG_STREAM=api-server
```

### Sentry Configuration

```env
# Sentry DSN (from project settings)
SENTRY_DSN=https://[email protected]/[project-id]

# Environment tag (auto-set from NODE_ENV)
# - development (100% sampling)
# - production (10% sampling)
```

---

## Implementation Details

### New Files Created

1. **`server/utilities/cloudWatchLogger.js`**

   - CloudWatch client initialization
   - Log batching and buffering
   - Automatic stream creation
   - Graceful degradation

2. **`server/utilities/sentryInit.js`**

   - Sentry client initialization
   - Rate limit alert helpers
   - Error capture utilities
   - Message capture with context

3. **Updated `server/utilities/logger.js`**

   - Integrated CloudWatch logging
   - All logs automatically sent to CloudWatch
   - Maintains existing console output

4. **Updated `server/middleware/rateLimiter.js`**
   - Automatic rate limit alerts to Sentry
   - Centralized `createLimiter()` factory
   - Consistent monitoring across all endpoints

---

## Testing

### Test CloudWatch Connection

```bash
# Enable CloudWatch with test credentials
CLOUDWATCH_ENABLED=true npm run server

# You should see:
# [CloudWatch] Initialized - Log Group: /woof-meetup/prod, Stream: api-server

# Check AWS CloudWatch logs to confirm
```

### Test Sentry Connection

```bash
# Enable Sentry with test DSN
SENTRY_DSN=https://... npm run server

# You should see:
# [Sentry] Initialized - Environment: development

# Try creating a rate limit event:
# Hit login endpoint 5+ times to trigger rate limit
# Check Sentry dashboard for the alert
```

### Test Rate Limit Alerts

```bash
# 1. Start server with Sentry enabled
SENTRY_DSN=https://... npm run server

# 2. Trigger rate limit (5+ failed logins)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Repeat 5+ times

# 3. Check Sentry for "Rate limit exceeded" warning
# Check CloudWatch for matching log entries
```

---

## Troubleshooting

### CloudWatch Connection Issues

**Problem:** "Missing AWS credentials"

```bash
# Verify environment variables are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
```

**Solution:** Add to Render environment variables or `.env.production`

---

**Problem:** "Permission denied on CloudWatch"

```
Error: User: arn:aws:iam::123:user/X is not authorized
```

**Solution:** Add IAM permissions for CloudWatch Logs

- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

---

### Sentry Connection Issues

**Problem:** "SENTRY_DSN not configured"

**Solution:** Copy DSN from Sentry project settings and add to environment:

```
SENTRY_DSN=https://[key]@[host]/[project-id]
```

---

## Next Steps

- [ ] Set up Sentry project at https://sentry.io
- [ ] Add SENTRY_DSN to Render environment
- [ ] Create AWS IAM user for CloudWatch
- [ ] Enable CLOUDWATCH_ENABLED in production
- [ ] Set up Sentry alerts for rate limit events
- [ ] Create CloudWatch dashboard for monitoring
- [ ] Configure CloudWatch log retention policies
- [ ] Test end-to-end monitoring with sample events

---

## Support & Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/python/
- **CloudWatch Docs:** https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/
- **AWS IAM:** https://console.aws.amazon.com/iam/
- **Render Environment:** https://render.com/docs/environment-variables

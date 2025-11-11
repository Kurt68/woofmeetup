# 🚀 Production Deployment Guide

Guide for deploying Woof Meetup to production.

---

## 📋 Pre-Deployment Checklist

### External Services Setup

- [ ] MongoDB Atlas production cluster created & connection string saved
- [ ] Stripe: Switch from Test Mode to Live Mode
- [ ] Stripe: Get production API keys (Secret Key)
- [ ] Stripe: Configure product prices with `STRIPE_PREMIUM_PRICE_ID` and `STRIPE_VIP_PRICE_ID`
- [ ] Stripe: Setup webhook endpoint at `/api/payments/webhook`
- [ ] AWS S3: Create bucket with public read access for images
- [ ] AWS CloudFront: Create distribution for S3 bucket
- [ ] AWS CloudFront: Generate private key and key pair ID
- [ ] AWS IAM: Create user with S3 and CloudFront permissions
- [ ] Cloudinary production account configured (alternative to S3)
- [ ] Mailtrap: Create production account and get token
- [ ] OpenAI: Create API key for content moderation
- [ ] Cloudflare Turnstile: Create production site key
- [ ] Sentry: Create project and get DSN for error tracking
- [ ] Redis: Configure (either Redis Cloud, AWS ElastiCache, or local for single-server)

### Domain & Security

- [ ] Domain name registered and configured
- [ ] SSL certificate obtained (Let's Encrypt via certbot or provided by hosting)
- [ ] HTTPS enforced on all endpoints

### Code Preparation

- [ ] All tests passing: `npm run test:e2e`
- [ ] Build tested locally: `npm run build && npm start`
- [ ] No console errors or warnings in production build
- [ ] Sentry DSN added to client `.env`
- [ ] All API endpoints tested with production-like data

---

## 🔐 Environment Variables

### Server Environment Variables

```env
# Server Core
PORT=8000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/DATABASE
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# JWT
JWT_SECRET=strong_random_secret_for_production

# Stripe (PRODUCTION KEYS)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_VIP_PRICE_ID=price_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=production_cloud_name
CLOUDINARY_API_KEY=production_api_key
CLOUDINARY_API_SECRET=production_api_secret

# AWS S3 & CloudFront
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_BUCKET_REGION=us-east-1
CLOUDFRONT_PRIVATE_KEY=your_cloudfront_private_key
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id

# Email (Mailtrap)
MAILTRAP_TOKEN=your_mailtrap_token

# AI Content Moderation
OPENAI_API_KEY=sk_...

# Cloudflare Turnstile (PRODUCTION KEYS)
TURNSTILE_SECRET_KEY=production_turnstile_secret

# Rate Limiting Configuration (Optional - uses sensible defaults if not set)
# Turnstile verification rate limiting - prevents brute force CAPTCHA bypass attempts
# Default: 10 attempts per 15 minutes per IP. Increase if legitimate users from shared IPs get blocked.
TURNSTILE_RATE_LIMIT_MAX=10
TURNSTILE_RATE_LIMIT_WINDOW_MS=900000

# Redis (Optional - for distributed rate limiting; uses in-memory if not set)
REDIS_URL=redis://:password@redis-host:6379
```

### Client Environment Variables

```env
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_TURNSTILE_SITE_KEY=production_turnstile_site_key
VITE_SENTRY_DSN=https://your_sentry_dsn
```

---

## 🔧 Stripe Production Setup

### 1. Create Products & Prices

Before switching to live mode, create your products in Stripe:

1. Go to **Stripe Dashboard → Products**
2. Create "Premium" product with price (e.g., $9.99/month)
3. Create "VIP" product with price (e.g., $19.99/month)
4. Copy the **Price IDs** (e.g., `price_1QoUTC...`)
5. Add to environment variables:
   - `STRIPE_PREMIUM_PRICE_ID=price_...`
   - `STRIPE_VIP_PRICE_ID=price_...`

### 2. Switch to Production Keys

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Go to **Developers → API keys**
3. Copy the **Secret key** (starts with `sk_live_`)
4. Update `STRIPE_SECRET_KEY` in `.env`

### 3. Configure Webhook Endpoint

Webhooks enable Stripe to notify your server of payment events in real-time. This is essential for subscription management, credit purchases, and invoice tracking.

#### 3.1 Create the Webhook Endpoint

Go to **Stripe Dashboard → Webhooks** tab (or direct URL: `https://dashboard.stripe.com/webhooks`):

1. Click **"+ Add destination"** button
2. **Step 1: Select Events**
   - Select **"Your account"** (to receive events from this account only)
   - Use the search box or expand categories to find and select:
     - **`checkout.session.completed`** — One-time credit purchases or subscription signup
     - **`customer.subscription.created`** — New subscription activated (Premium/VIP tier)
     - **`customer.subscription.updated`** — Subscription tier changed or renewal date adjusted
     - **`customer.subscription.deleted`** — Subscription cancelled; downgrade user access
     - **`invoice.payment_succeeded`** — Recurring invoice paid successfully
     - **`invoice.payment_failed`** — Recurring invoice payment failed; notify user to retry
   - Verify **API version** is set to current (e.g., `2025-01-27.acacia`)
   - Click **"Continue →"**
3. **Step 2: Choose Destination Type**
   - Select **"Webhook"** (not Event Bridge or HTTP destination)
   - Click **"Continue →"**
4. **Step 3: Configure Your Destination**
   - Set **Endpoint URL**: `https://yourdomain.com/api/payments/webhook`
     - Must be publicly accessible and support HTTPS
     - Stripe will POST to this URL for each selected event
   - Click **"Add destination"**

#### 3.2 Store the Signing Secret

1. Copy the **Signing secret** (starts with `whsec_`) from the endpoint details page
2. Update `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   - Do **NOT** commit this to git — only add to production `.env`
   - Keep this secret secure; if exposed, rotate it immediately

#### 3.3 Webhook Event Handlers

Each selected event triggers a specific handler in `server/controllers/webhook.controller.js`:

| Event | Handler | What Happens |
|-------|---------|------|
| `checkout.session.completed` | `handleCheckoutCompleted()` | Credits added to user account; subscription created if tier upgrade |
| `customer.subscription.created` | `handleSubscriptionCreated()` | User tier updated; welcome email sent |
| `customer.subscription.updated` | `handleSubscriptionUpdated()` | Subscription metadata updated (e.g., proration for tier changes) |
| `customer.subscription.deleted` | `handleSubscriptionDeleted()` | User downgraded; tier removed from account |
| `invoice.payment_succeeded` | `handleInvoicePaymentSucceeded()` | Recurring payment recorded; credits renewed if applicable |
| `invoice.payment_failed` | `handleInvoicePaymentFailed()` | User alerted; retry flag set; subscription paused if too many failures |

#### 3.4 Security Features

The webhook endpoint implements **signature verification** and **idempotency**:

- **Signature Verification**: Every webhook request is cryptographically signed by Stripe. The signature is verified using your `STRIPE_WEBHOOK_SECRET` before any handler runs. Unsigned or tampered requests are rejected with HTTP 400.
- **Idempotency Check**: If Stripe retries a webhook (due to network timeout or other issues), the event ID is checked against the database. Duplicate events are acknowledged without re-processing credits or subscriptions.
- **Rate Limiting**: Webhook endpoint is rate-limited to prevent abuse.

### 4. Test Webhook in Production

#### 4.1 Send Test Events from Stripe Dashboard

**Option A: Using Stripe CLI (Recommended)**

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to your account
stripe login

# Send test events to your local endpoint
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed

# View logs
stripe logs tail
```

**Option B: Using Stripe Dashboard UI**

1. Go to **Webhooks** tab (at `https://dashboard.stripe.com/webhooks`)
2. Find your endpoint URL in the list (e.g., `https://yourdomain.com/api/payments/webhook`)
3. Click on it to view details
4. Scroll down to **Testing your webhook** section
5. Use the test form or CLI command shown there to send individual events

#### 4.2 Verify Webhook Reception

After sending a test event, verify your server received and processed it:

```bash
# View recent logs
pm2 logs woof-server | grep webhook

# Example successful output:
# Processing webhook: checkout.session.completed (Event ID: evt_1..., Timestamp: 2025-...)
# Webhook already processed (idempotency): ... (if re-testing same event)
```

#### 4.3 Verify Database Changes

After a test webhook event, check MongoDB directly:

```bash
# Connect to MongoDB
mongo "mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/DATABASE"

# For checkout.session.completed:
db.transactions.findOne({ 'metadata.stripeEventId': 'evt_...' })

# For subscription events:
db.users.findOne({ stripeCustomerId: 'cus_...' })
# Look for `tier`, `subscriptionId`, and `subscriptionStatus` fields

# For invoice events:
db.transactions.find({ type: 'subscription_renewal' }).sort({ createdAt: -1 }).limit(5)
```

#### 4.4 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook shows "Failed" in dashboard | Endpoint returned non-200 status | Check PM2 logs for errors; verify `.env` has `STRIPE_WEBHOOK_SECRET` |
| Event received but not processed | Signature verification failed | Confirm `STRIPE_WEBHOOK_SECRET` matches endpoint secret exactly (no typos) |
| Duplicate processing (multiple credits) | Idempotency not working | Verify MongoDB is storing event IDs in transactions; check for old duplicate events |
| Subscription not activated | Handler logic error | Check Sentry for exceptions; verify user ID is valid; check `STRIPE_PREMIUM_PRICE_ID` matches Stripe |

### 5. End-to-End Payment Flow Test

#### 5.1 In Live Mode

1. Load your app and navigate to **Settings → Subscription** or **Credits**
2. Click **"Upgrade"** or **"Buy Credits"**
3. Use a **real credit card** (Stripe will charge $0.00 during setup; no refund needed)
4. Verify:
   - Payment succeeds and redirects to app
   - User tier or credit balance updates immediately
   - Email confirmation sent (check Mailtrap dashboard)
   - Transaction recorded in MongoDB

#### 5.2 Monitor for Errors

```bash
# Monitor Sentry for webhook errors
# (via dashboard, search for event type: webhook_error)

# Or check PM2 logs during test
pm2 logs woof-server &
# (keep this running while testing the payment flow)

# Stop monitoring
fg  # bring PM2 logs to foreground
# Press Ctrl+C to exit
```

#### 5.3 Verify Invoice & Subscription in Stripe

1. In **Stripe Dashboard → Customers**, find your test customer
2. Check:
   - **Active Subscriptions** (should show Premium or VIP)
   - **Payment Method** (card details)
   - **Billing History** (invoices and payments)
3. If subscription exists, Stripe will automatically retry failed invoices per your retry rules

---

## 🏗️ Build & Test Process

```bash
# Install all dependencies
npm install
npm install --prefix client

# Run tests
npm run test:e2e

# Build client (bundles React with Vite)
npm run build

# Verify build output
ls -lh client/dist/
du -sh client/dist/
```

---

## 🌐 Deployment Options

### Option 1: VPS (DigitalOcean, AWS EC2)

```bash
# Install Node.js (18+ required for ESM modules)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone your-repo-url
cd woof-meetup
npm install

# Configure environment variables
nano .env
# Copy all required variables from Environment Variables section

# Build client
npm run build

# Test the server locally (optional)
PORT=8000 NODE_ENV=production node server/index.js &
# Verify it starts without errors, then kill it
kill %1

# Start with PM2
pm2 start server/index.js --name woof-server
pm2 save
pm2 startup
pm2 logs woof-server
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (obtained from Let's Encrypt via certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Proxy to PM2-managed Node.js server
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:8000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Setup SSL with Let's Encrypt:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Option 2: PaaS (Heroku, Railway, Render)

**Procfile:**

```
web: node server/index.js
```

**Deploy:**

```bash
git push heroku main
```

---

## 🔒 Security Checklist

### Environment & Keys
- [ ] All API keys stored in `.env` (never in code)
- [ ] JWT_SECRET is strong (min 32 characters, random)
- [ ] No test/development keys used in production

### Network & Transport
- [ ] HTTPS enabled with valid SSL certificate
- [ ] HTTP redirects to HTTPS
- [ ] CORS configured to allow only `CLIENT_URL` domain
- [ ] WebSocket (Socket.io) secured over WSS

### Database
- [ ] MongoDB authentication enabled
- [ ] IP whitelist configured (MongoDB Atlas)
- [ ] Database backups scheduled
- [ ] NoSQL injection protection via mongo-sanitize

### Authentication & Validation
- [ ] JWT tokens have short expiration times
- [ ] Input validation on all API endpoints (express-validator)
- [ ] CSRF protection enabled on form submissions
- [ ] Rate limiting enabled (Redis or in-memory)

### Payment & Webhooks
- [ ] Stripe webhook signature verification enabled
- [ ] Webhook endpoint validates `STRIPE_WEBHOOK_SECRET`
- [ ] Stripe keys never logged or exposed in errors
- [ ] Test payments work before accepting live traffic

### Content Security
- [ ] Helmet security headers enabled
- [ ] Content Security Policy (CSP) configured
- [ ] Cloudflare Turnstile configured (CAPTCHA)
- [ ] OpenAI Vision API only called for moderation

### Monitoring & Logging
- [ ] Sentry error tracking configured
- [ ] PM2 logging active and monitored
- [ ] No sensitive data in error logs
- [ ] Production database connection string never logged

---

## 📊 Monitoring

### PM2 Process Management

```bash
# View real-time processes
pm2 monit

# View server logs
pm2 logs woof-server

# View only errors
pm2 logs woof-server --err

# Check process status
pm2 status

# View application uptime
pm2 info woof-server
```

### Sentry Error Tracking

**Already configured in your app**

1. Errors from both frontend and backend are automatically reported
2. Visit **Sentry Dashboard** for:
   - Real-time error alerts
   - Error frequency and patterns
   - Performance monitoring
3. Configure alerts in Sentry → Project Settings → Alerts

**Check for issues:**
```bash
curl https://sentry.io/api/0/organizations/{org}/issues/
```

### Stripe Payment Monitoring

1. **Stripe Dashboard → Developers → Webhooks**
   - Monitor webhook delivery status
   - Retry failed events manually

2. **Stripe Dashboard → Payments**
   - Review successful/failed charges
   - Track subscription statuses

3. **Alert Setup:**
   - Set up email alerts for failed payments
   - Monitor chargeback rates

### Application Health Checks

```bash
# Check if server is running
curl https://yourdomain.com/

# Check Socket.io connection
curl https://yourdomain.com/socket.io/

# Monitor server resources
free -h      # Memory usage
df -h        # Disk usage
top -p $(pgrep -f "node server")  # CPU usage
```

### Uptime Monitoring Services

- **UptimeRobot:** Configure to monitor `https://yourdomain.com/`
- **StatusPage:** Display service status to users
- **PagerDuty:** Get alerted on downtime

---

## 🔄 Deployment Workflow

### Pre-Deployment

1. **Test locally:**

   ```bash
   npm run test:e2e
   npm run build
   PORT=8000 NODE_ENV=production npm start
   # Visit http://localhost:8000 and test critical flows
   ```

2. **Create release:**

   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin main --tags
   ```

### Production Deployment

1. **Pull latest code:**

   ```bash
   cd /path/to/woof-meetup
   git pull origin main
   ```

2. **Install dependencies & build:**

   ```bash
   npm install
   npm install --prefix client
   npm run build
   ```

3. **Restart application:**

   ```bash
   pm2 restart woof-server
   pm2 logs woof-server  # Monitor startup
   ```

4. **Verify deployment:**

   - Check health: `curl https://yourdomain.com/api/health` (if endpoint exists)
   - Test authentication flow
   - Test real-time messaging (Socket.io)
   - Test payment integration with test card
   - Monitor Sentry for new errors
   - Check PM2 logs: `pm2 logs woof-server`

---

## 🐛 Troubleshooting

### Webhooks Not Receiving Events

**Problem:** Stripe webhooks not reaching your server

**Solution:**
```bash
# 1. Check webhook URL in Stripe Dashboard
# Stripe Dashboard → Developers → Webhooks → (Your endpoint)
# Verify URL is: https://yourdomain.com/api/payments/webhook

# 2. Verify signing secret matches
echo $STRIPE_WEBHOOK_SECRET  # Should match Stripe Dashboard

# 3. Check server logs for webhook requests
pm2 logs woof-server | grep -i webhook

# 4. Test webhook from Stripe Dashboard
# Click "Send test event" → Select "checkout.session.completed"
# Check logs again for delivery attempt
```

### Server Won't Start

**Problem:** PM2 shows process crashed

**Solution:**
```bash
# View detailed error
pm2 logs woof-server --err --lines 50

# Check environment variables are loaded
cat .env | grep MONGODB_URI

# Test starting server manually to see errors
NODE_ENV=production node server/index.js

# Common causes:
# - Missing environment variables (MONGODB_URI, JWT_SECRET, etc.)
# - Port 8000 already in use: lsof -i :8000
# - Database connection timeout
```

### Socket.io Connection Issues

**Problem:** Real-time messaging not working

**Solution:**
```bash
# Check WebSocket is proxied correctly in Nginx
# Verify Nginx config has /socket.io location block

# Check firewall allows WebSocket connections
# Port 80/443 should be open

# Monitor Socket.io logs
pm2 logs woof-server | grep -i socket

# Test WebSocket manually
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://yourdomain.com/socket.io/
```

### Database Connection Issues

**Problem:** "Cannot connect to MongoDB" error

**Solution:**
```bash
# 1. Verify connection string format
echo $MONGODB_URI | head -c 50  # Show first 50 chars

# 2. Check MongoDB Atlas IP whitelist
# MongoDB Atlas → Network Access → IP Whitelist
# Add your server's public IP

# 3. Test connection manually
# Install MongoDB tools and test:
mongosh "$MONGODB_URI"

# 4. Check if connection pool is exhausted
pm2 logs woof-server | grep -i "pool\|timeout\|ECONNREFUSED"

# 5. Verify credentials
# Username/password in MONGODB_URI should be URL-encoded
```

### File Upload Not Working

**Problem:** Image uploads fail (S3 or Cloudinary)

**Solution:**
```bash
# 1. Check S3/CloudFront credentials
echo $AWS_ACCESS_KEY_ID | head -c 10
echo $AWS_SECRET_ACCESS_KEY | head -c 10

# 2. Verify S3 bucket permissions
# AWS Console → S3 → Bucket → Permissions → Bucket Policy
# Should allow PutObject and GetObject

# 3. Check CloudFront distribution
# AWS Console → CloudFront → Distribution
# Verify Origin points to S3 bucket

# 4. Verify AWS IAM user has permissions
# Policies should include: s3:PutObject, s3:GetObject, cloudfront:CreateInvalidation

# 5. Check logs
pm2 logs woof-server | grep -i "upload\|s3\|cloudinary"
```

### High Memory/CPU Usage

**Problem:** Server running slowly or out of memory

**Solution:**
```bash
# Check memory usage
free -h
# If free memory < 100MB, restart PM2

# Check disk space
df -h
# If usage > 90%, clean up old logs

# Monitor CPU per process
top -p $(pgrep -f "node server")

# Restart server with max memory flag
pm2 restart woof-server --max-memory-restart 500M

# Check for memory leaks in logs
pm2 logs woof-server | grep -i "memory\|heap"
```

### SSL Certificate Expired

**Problem:** HTTPS shows certificate error

**Solution:**
```bash
# Check certificate expiration
openssl s_client -connect yourdomain.com:443 </dev/null | \
  grep "notAfter"

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Reload Nginx to pick up new certificate
sudo systemctl reload nginx

# Verify new certificate
curl https://yourdomain.com
```

---

## 📈 Performance Optimization

### Server-Side

- **Gzip Compression:** Configured in Nginx config above
- **Redis Caching:** Configured for rate limiting; can add session caching
- **Database Optimization:**
  - Create indexes on frequently queried fields
  - Monitor slow queries in MongoDB
  - Use connection pooling (built into Mongoose)
- **CDN for Static Assets:** CloudFront for S3 images
- **Enable HTTP/2:** Configured in Nginx (see SSL section)

### Client-Side (Vite)

**Already optimized:**
- Code splitting configured
- Tree shaking enabled
- Minification enabled
- Asset hashing for cache busting

**Additional optimizations:**
```bash
# Analyze bundle size
npm run build:analyze

# View build report
npm run build:report
```

### Database Optimization

```bash
# Monitor indexes on MongoDB Atlas
# MongoDB Atlas → Collections → Indexes

# Add indexes for common queries
db.users.createIndex({ email: 1 })
db.messages.createIndex({ senderId: 1, receiverId: 1 })
db.subscriptions.createIndex({ userId: 1 })
```

### Monitoring Performance

```bash
# Check page load times in browser DevTools
# Check Core Web Vitals in Sentry → Performance

# Monitor server response times
pm2 logs woof-server | grep "ms" | tail -20
```

---

## 🛠️ Troubleshooting

### Turnstile Rate Limit Errors

**Error:** `"Too many verification attempts from this IP, please try again after 15 minutes"` with code `TURNSTILE_RATE_LIMIT_EXCEEDED`

**Causes:**
- Multiple users behind the same IP (corporate network, VPN, shared office WiFi)
- Failed verification attempts being retried too quickly
- Network timeouts from Cloudflare Turnstile service

**Solutions:**

1. **Increase the rate limit threshold** (if experiencing legitimate user blocks):
   ```env
   TURNSTILE_RATE_LIMIT_MAX=15        # Increase from default 10
   TURNSTILE_RATE_LIMIT_WINDOW_MS=1800000  # Extend to 30 minutes
   ```

2. **Add client-side retry logic** with exponential backoff in `client/src/components/auth/TurnstileSection.jsx` to reduce request spam

3. **Monitor affected IPs** - Check Sentry logs for rate limit hits to identify if specific networks are being blocked

4. **Whitelist corporate networks** by excluding their IPs from rate limiting (if using a proxy or load balancer)

---

## 🔄 Rollback Procedure

**Use only if production breaks and immediate fix is needed**

```bash
# 1. Check current version
git describe --tags

# 2. Identify previous stable version
git tag -l | sort -V | tail -5

# 3. Rollback to previous version
git checkout v1.0.0  # Replace with actual previous tag

# 4. Rebuild and restart
npm install
npm run build
pm2 restart woof-server

# 5. Verify it's working
curl https://yourdomain.com/

# 6. After confirming stable, investigate what broke
pm2 logs woof-server --err

# 7. Once fixed, deploy new version
git checkout main
git pull
npm run build
pm2 restart woof-server
```

---

**Good luck with your deployment! 🐕**

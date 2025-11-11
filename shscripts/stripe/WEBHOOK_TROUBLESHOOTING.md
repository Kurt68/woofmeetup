# Stripe Webhook Troubleshooting Guide

## Issue Summary
Stripe webhooks were failing with HTTP 307 redirects and not updating the database.

## Root Causes Identified

### 1. HTTP 307 Redirect Issue ✅ FIXED
**Problem**: HTTPS redirect middleware was intercepting webhook requests  
**Solution**: Modified `server/index.js` to exempt webhook endpoints from HTTPS redirect

### 2. Database Not Updating
**Problem**: Webhook received but database not updated  
**Possible Causes**:
- Server not restarted after code deployment
- Webhook signature verification failing
- Race condition with customer ID lookup
- Missing environment variables

## Fixes Applied

### Code Changes
1. **server/index.js:51** - Added webhook exemption from HTTPS redirect
2. **server/controllers/webhook.controller.js:248-302** - Enhanced logging and transaction tracking

### Manual Database Fix
User `martincooldog@outlook.com` subscription was manually updated using:
```bash
node shscripts/stripe/fix-subscription.js
```

## Verification Steps

### 1. Check Database Status
```bash
node shscripts/stripe/check-customer-id.js
```

Expected output:
- ✅ Subscription: premium
- ✅ Status: active
- ✅ Stripe Subscription ID: sub_1SSMgrLIapPWbhRsEv9N9wN0

### 2. Check Production Server Logs
```bash
# On production server
pm2 logs woof-server | grep -i webhook

# Or use the helper script
./shscripts/stripe/check-webhook-logs.sh
```

### 3. Test Webhook Endpoint
```bash
# From Stripe Dashboard
1. Go to Webhooks → Select your endpoint
2. Click "Send test webhook"
3. Select "customer.subscription.created"
4. Check response status (should be 200)
```

### 4. Resend Failed Webhook
```bash
# From Stripe Dashboard
1. Go to Events → Find event: evt_1SSMgsLIapPWbhRszifPp7x5
2. Click "Resend"
3. Monitor server logs for processing
```

## Production Deployment Checklist

- [x] Code changes committed
- [ ] Code deployed to production server
- [ ] Production server restarted: `pm2 restart woof-server`
- [ ] Environment variables verified (STRIPE_WEBHOOK_SECRET)
- [ ] Webhook endpoint tested from Stripe Dashboard
- [ ] Database updated correctly
- [ ] Logs show successful webhook processing

## Common Issues & Solutions

### Issue: Webhook returns 400 "Invalid webhook signature"
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` in production `.env` matches Stripe Dashboard

```bash
# On production server
grep STRIPE_WEBHOOK_SECRET .env
# Compare with Stripe Dashboard → Webhooks → Signing secret
```

### Issue: Webhook returns 500 "User not found"
**Solution**: Ensure user has `stripeCustomerId` set before subscription creation

```bash
# Check user's customer ID
node shscripts/stripe/check-customer-id.js
```

### Issue: Webhook returns 307 redirect
**Solution**: Ensure webhook exemption code is deployed and server restarted

```bash
# Verify code is deployed
grep "isWebhook" server/index.js
# Should show: const isWebhook = req.path === '/api/payments/webhook'...

# Restart server
pm2 restart woof-server
```

### Issue: Database not updating despite 200 response
**Solution**: Check server logs for errors during webhook processing

```bash
pm2 logs woof-server --lines 200 | grep -A 10 -B 5 "webhook.controller"
```

## Monitoring Commands

### View Live Webhook Logs
```bash
pm2 logs woof-server | grep -i "webhook\|subscription"
```

### View Recent Errors
```bash
pm2 logs woof-server --err --lines 50
```

### Check Server Status
```bash
pm2 status
pm2 info woof-server
```

### View All Logs
```bash
pm2 logs woof-server
```

## Testing New Subscriptions

### 1. Create Test Subscription
```bash
# Use Stripe test mode
# Create subscription via frontend
# Monitor logs: pm2 logs woof-server | grep webhook
```

### 2. Verify Database Update
```bash
node shscripts/stripe/check-customer-id.js
```

### 3. Check Transaction Record
```javascript
// In MongoDB Compass or shell
db.transactions.find({ 
  "metadata.subscriptionId": "sub_..." 
}).sort({ createdAt: -1 }).limit(1)
```

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_VIP_PRICE_ID=price_...

# MongoDB
MONGODB_URI=mongodb+srv://...

# Server
NODE_ENV=production
PORT=8000
```

## Webhook Events Handled

- ✅ `checkout.session.completed` - One-time credit purchases
- ✅ `customer.subscription.created` - New subscription
- ✅ `customer.subscription.updated` - Subscription changes
- ✅ `customer.subscription.deleted` - Subscription cancelled
- ✅ `invoice.payment_succeeded` - Recurring payment success
- ✅ `invoice.payment_failed` - Payment failure

## Support Scripts

### Check Customer ID
```bash
node shscripts/stripe/check-customer-id.js
```

### Fix Subscription Manually
```bash
node shscripts/stripe/fix-subscription.js
```

### Check Webhook Logs
```bash
./shscripts/stripe/check-webhook-logs.sh
```

## Next Steps

1. **Deploy to Production**
   ```bash
   # On production server
   git pull origin main
   pm2 restart woof-server
   pm2 logs woof-server
   ```

2. **Test Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Send test webhook for `customer.subscription.created`
   - Verify 200 response

3. **Monitor Logs**
   ```bash
   pm2 logs woof-server | grep -i webhook
   ```

4. **Verify Database**
   ```bash
   node shscripts/stripe/check-customer-id.js
   ```

## Contact Information

- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
- **Webhook Endpoint**: https://woofmeetup.com/api/payments/webhook
- **Production Server**: SSH access required for logs

---

**Last Updated**: November 11, 2025  
**Status**: Database manually fixed, webhook code updated, awaiting production deployment verification

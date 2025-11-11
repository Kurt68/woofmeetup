#!/bin/bash

echo "🚀 Webhook Fix Deployment Guide"
echo "================================"
echo ""

echo "📋 STEP 1: Push Code to Git (LOCAL MACHINE)"
echo "-----------------------------------------------------------"
echo "Run these commands on your LOCAL machine:"
echo ""
echo "  cd /Users/kurt/code/woof-meetup"
echo "  git add server/index.js server/controllers/webhook.controller.js"
echo "  git commit -m 'Fix webhook HTTP 307 redirect and enhance logging'"
echo "  git push origin main"
echo ""
read -p "Press Enter after you've pushed the code to Git..."
echo ""

echo "📋 STEP 2: Deploy on Production Server"
echo "-----------------------------------------------------------"
echo "You need to SSH into your production server and run:"
echo ""
echo "  ssh your-user@your-production-server"
echo "  cd /path/to/woof-meetup"
echo "  git pull origin main"
echo "  pm2 restart woof-server"
echo "  pm2 logs woof-server --lines 20"
echo ""
echo "💡 Replace 'your-user@your-production-server' with your actual SSH details"
echo ""
read -p "Press Enter after you've deployed on production server..."
echo ""

echo "📋 STEP 3: Test Webhook Endpoint (LOCAL MACHINE)"
echo "-----------------------------------------------------------"
echo "Testing webhook endpoint..."
echo ""

WEBHOOK_URL="https://woofmeetup.com/api/payments/webhook"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)

echo "HTTP Status Code: $HTTP_RESPONSE"
echo ""

if [ "$HTTP_RESPONSE" = "400" ]; then
    echo "✅ SUCCESS! Webhook endpoint is working correctly"
    echo "   (400 = signature verification required, which is expected)"
    echo ""
    echo "📋 STEP 4: Resend Failed Webhook from Stripe"
    echo "-----------------------------------------------------------"
    echo "1. Go to: https://dashboard.stripe.com/events"
    echo "2. Find event: evt_1SSMgsLIapPWbhRszifPp7x5"
    echo "3. Click 'Resend' button"
    echo "4. Verify it shows 'Succeeded' with HTTP 200"
    echo ""
    echo "📋 STEP 5: Verify Database Update"
    echo "-----------------------------------------------------------"
    echo "Run: node shscripts/stripe/check-customer-id.js"
    echo ""
    echo "🎉 Deployment Complete!"
elif [ "$HTTP_RESPONSE" = "307" ] || [ "$HTTP_RESPONSE" = "301" ]; then
    echo "❌ FAILED: Still getting redirect (HTTP $HTTP_RESPONSE)"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Verify code was pulled: ssh to server and run 'git log -1'"
    echo "   2. Verify server was restarted: ssh to server and run 'pm2 status'"
    echo "   3. Check server logs: ssh to server and run 'pm2 logs woof-server'"
    echo ""
    echo "💡 The fix may not have been deployed correctly."
else
    echo "⚠️  Unexpected status code: $HTTP_RESPONSE"
    echo ""
    echo "🔍 Check server logs on production:"
    echo "   pm2 logs woof-server"
fi

echo ""

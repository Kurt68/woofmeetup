#!/bin/bash

echo "🧪 Testing Webhook Endpoint"
echo "============================"
echo ""

WEBHOOK_URL="https://woofmeetup.com/api/payments/webhook"

echo "📍 Endpoint: $WEBHOOK_URL"
echo ""

echo "1️⃣ Testing HTTP connectivity..."
echo "-----------------------------------------------------------"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)

echo "HTTP Status Code: $HTTP_RESPONSE"

if [ "$HTTP_RESPONSE" = "400" ]; then
    echo "✅ Endpoint is reachable (400 = signature verification required)"
elif [ "$HTTP_RESPONSE" = "307" ] || [ "$HTTP_RESPONSE" = "301" ]; then
    echo "❌ REDIRECT DETECTED! Webhook is being redirected."
    echo "   This means the HTTPS exemption fix is not deployed."
elif [ "$HTTP_RESPONSE" = "200" ]; then
    echo "⚠️  200 OK - Unexpected (should require signature)"
elif [ "$HTTP_RESPONSE" = "000" ]; then
    echo "❌ Cannot connect to endpoint"
else
    echo "⚠️  Unexpected status code: $HTTP_RESPONSE"
fi

echo ""
echo "2️⃣ Testing with verbose output..."
echo "-----------------------------------------------------------"
curl -v -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"test"}' 2>&1 | grep -E "HTTP|Location|stripe"

echo ""
echo ""
echo "📋 Expected Results:"
echo "-----------------------------------------------------------"
echo "✅ GOOD: HTTP 400 (signature verification required)"
echo "❌ BAD:  HTTP 307/301 (redirect - fix not deployed)"
echo "❌ BAD:  Connection refused (server not running)"
echo ""
echo "💡 If you see a redirect (307/301):"
echo "   1. Verify code is deployed: grep 'isWebhook' server/index.js"
echo "   2. Restart server: pm2 restart woof-server"
echo "   3. Re-run this test"
echo ""

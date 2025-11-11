#!/bin/bash

# Test script to manually trigger the scheduled deletion cron job
# This will process all users with pendingDeletion=true and scheduledDeletionDate <= now
#
# Usage:
#   ./test-scheduled-deletion.sh              # Local development (uses dev bypass)
#   ./test-scheduled-deletion.sh production   # Production (requires proper auth)
#   ./test-scheduled-deletion.sh --force      # Force using production-like auth

echo "🧪 Triggering scheduled deletion cron job..."
echo ""

# Determine the API URL and auth method based on environment
if [ "$1" == "production" ]; then
    API_URL="https://woofmeetup.com/api/auth/trigger-scheduled-deletion"
    USE_DEV_BYPASS="false"
    echo "🌐 Using PRODUCTION environment"
    echo "⚠️  Requires proper authentication (not implemented in this script)"
    exit 1
elif [ "$1" == "--force" ]; then
    API_URL="http://localhost:8000/api/auth/trigger-scheduled-deletion"
    USE_DEV_BYPASS="false"
    echo "🏠 Using LOCAL environment (production-like auth - not implemented)"
    exit 1
else
    API_URL="http://localhost:8000/api/auth/trigger-scheduled-deletion"
    USE_DEV_BYPASS="true"
    echo "🏠 Using LOCAL environment (development mode)"
    echo "🔑 Using development bypass header"
fi

echo "📡 Endpoint: $API_URL"
echo ""

# Make the POST request with development bypass header
if [ "$USE_DEV_BYPASS" == "true" ]; then
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -H "X-Dev-Trigger: scheduled-deletion" \
      -w "\nHTTP_STATUS:%{http_code}")
else
    # Future: Add proper auth flow here
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -w "\nHTTP_STATUS:%{http_code}")
fi

# Extract HTTP status code
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "📊 Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" == "200" ]; then
    echo "✅ Scheduled deletion job executed successfully!"
elif [ "$http_status" == "403" ]; then
    echo "❌ Authentication failed (HTTP 403)"
    echo "💡 For local testing, ensure NODE_ENV=development and server is running"
elif [ "$http_status" == "500" ]; then
    echo "❌ Server error (HTTP 500)"
    echo "💡 Check server logs for details"
else
    echo "❌ Failed with HTTP status: $http_status"
fi

echo ""
echo "💡 For detailed info, check server logs: tail -f server.log"
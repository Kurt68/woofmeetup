#!/bin/bash

echo "🔍 Checking Stripe Webhook Logs"
echo "================================"
echo ""

# Check if we're on the production server
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is installed"
    echo ""
    
    echo "📊 PM2 Process Status:"
    pm2 status
    echo ""
    
    echo "🔍 Searching for webhook-related logs (last 100 lines)..."
    echo "-----------------------------------------------------------"
    pm2 logs woof-server --lines 100 --nostream | grep -i "webhook\|stripe\|subscription" || echo "No webhook logs found"
    echo ""
    
    echo "🔍 Searching for recent errors (last 50 lines)..."
    echo "-----------------------------------------------------------"
    pm2 logs woof-server --err --lines 50 --nostream | tail -20
    echo ""
    
    echo "💡 To view live logs, run:"
    echo "   pm2 logs woof-server"
    echo ""
    echo "💡 To view only webhook logs in real-time, run:"
    echo "   pm2 logs woof-server | grep -i webhook"
    echo ""
    echo "💡 To restart the server after code changes:"
    echo "   pm2 restart woof-server"
    echo ""
else
    echo "❌ PM2 is not installed or not in PATH"
    echo "💡 This script should be run on the production server"
    echo ""
    echo "📝 To check logs on production server:"
    echo "   1. SSH into your production server"
    echo "   2. Run: pm2 logs woof-server | grep -i webhook"
    echo ""
fi

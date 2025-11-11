#!/bin/bash

# Test script for scheduled deletion endpoint security
# Usage: ./test-security.sh [admin-jwt-token]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8000}"
ENDPOINT="/api/auth/trigger-scheduled-deletion"
FULL_URL="${BASE_URL}${ENDPOINT}"

echo ""
echo "🧪 Testing Scheduled Deletion Endpoint Security"
echo "================================================"
echo "URL: ${FULL_URL}"
echo ""

# Test 1: No Authentication
echo -e "${BLUE}Test 1: Request without authentication${NC}"
echo "Expected: 401 Unauthorized"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FULL_URL}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Returns 401 Unauthorized"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAIL${NC}: Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 2: With Admin Token (if provided)
if [ -n "$1" ]; then
    echo -e "${BLUE}Test 2: Request with admin token${NC}"
    echo "Expected: 200 Success (if admin) or 403 Forbidden (if not admin)"
    echo ""
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FULL_URL}" \
        --cookie "token=$1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}: Returns 200 Success (user is admin)"
        echo "Response: $BODY"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo -e "${YELLOW}⚠️  INFO${NC}: Returns 403 Forbidden (user is not admin)"
        echo "Response: $BODY"
        echo ""
        echo "To set user as admin, run:"
        echo "mongosh YOUR_MONGODB_URI --eval 'db.users.updateOne({email:\"your@email.com\"}, {\$set: {isAdmin: true}})'"
    else
        echo -e "${RED}❌ FAIL${NC}: Expected 200 or 403, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
    echo ""
    
    # Test 3: Rate Limiting (optional)
    if [ "$2" = "--test-rate-limit" ]; then
        echo -e "${BLUE}Test 3: Rate limiting (making 4 requests)${NC}"
        echo -e "${YELLOW}⚠️  Warning: This will consume your rate limit!${NC}"
        echo "Expected: 429 Too Many Requests after 3 requests"
        echo ""
        
        for i in {1..4}; do
            RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${FULL_URL}" \
                --cookie "token=$1")
            HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
            BODY=$(echo "$RESPONSE" | sed '$d')
            
            echo "Request $i: HTTP $HTTP_CODE"
            
            if [ "$HTTP_CODE" = "429" ]; then
                echo -e "${GREEN}✅ PASS${NC}: Rate limiting is working!"
                echo "Response: $BODY"
                break
            fi
            
            sleep 0.2
        done
        echo ""
    else
        echo -e "${BLUE}Test 3: Rate limiting${NC}"
        echo "Skipped (add --test-rate-limit to run)"
        echo -e "${YELLOW}⚠️  Warning: This test will consume your rate limit!${NC}"
        echo ""
    fi
else
    echo -e "${BLUE}Test 2 & 3: Skipped${NC}"
    echo "To test with authentication, provide JWT token:"
    echo "  ./test-security.sh YOUR_JWT_TOKEN"
    echo ""
    echo "To also test rate limiting:"
    echo "  ./test-security.sh YOUR_JWT_TOKEN --test-rate-limit"
    echo ""
fi

# Summary
echo "═══════════════════════════════════════════════════════"
echo "Security Features Implemented:"
echo "═══════════════════════════════════════════════════════"
echo "✅ Authentication (verifyToken)"
echo "✅ Admin Role Check (checkAdminRole)"
echo "✅ Rate Limiting (deletionEndpointLimiter)"
echo ""
echo "Configuration:"
echo "  • Rate Limit: 3 requests per hour per IP"
echo "  • Admin Only: isAdmin: true required"
echo "  • Auth Method: JWT token in cookie"
echo "═══════════════════════════════════════════════════════"
echo ""

# Next steps
echo "📚 Next Steps:"
echo ""
echo "1. Set up admin user:"
echo "   See ADMIN_QUICK_START.md for instructions"
echo ""
echo "2. Get JWT token:"
echo "   • Log in to your app"
echo "   • Open DevTools (F12) → Application → Cookies"
echo "   • Copy the 'token' cookie value"
echo ""
echo "3. Run full test:"
echo "   ./test-security.sh YOUR_JWT_TOKEN"
echo ""
echo "4. Review documentation:"
echo "   • TEST_ENDPOINT.md - Full endpoint documentation"
echo "   • SECURITY_IMPLEMENTATION.md - Technical details"
echo "   • ADMIN_QUICK_START.md - Quick start guide"
echo ""
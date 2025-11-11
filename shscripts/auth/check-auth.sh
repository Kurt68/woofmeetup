#!/bin/zsh

# Check authentication status for a logged-in user
# Usage: ./check-auth.sh <keychain-service-name> [server-url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default server URL
SERVER_URL="${2:-http://localhost:8000}"
API_ENDPOINT="${SERVER_URL}/api/auth/check-auth"

# Check if service name is provided
if [ -z "$1" ]; then
    echo "${RED}Error: Keychain service name is required${NC}"
    echo "Usage: $0 <keychain-service-name> [server-url]"
    echo ""
    echo "Example: $0 woofmeetup-user1"
    exit 1
fi

SERVICE_NAME="$1"
COOKIE_FILE="/tmp/woofmeetup_cookies_${SERVICE_NAME}.txt"

echo "${BLUE}=== Check Authentication Status ===${NC}"
echo "Service: ${YELLOW}${SERVICE_NAME}${NC}"
echo "Server: ${YELLOW}${SERVER_URL}${NC}"
echo ""

# Check if cookie file exists
if [ ! -f "$COOKIE_FILE" ]; then
    echo "${RED}✗ No session found${NC}"
    echo "Cookie file not found: ${COOKIE_FILE}"
    echo ""
    echo "Please login first:"
    echo "  ./shscripts/auth/login.sh ${SERVICE_NAME}"
    exit 1
fi

echo "${BLUE}Checking authentication...${NC}"

# Make request with cookies
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_ENDPOINT" \
    -b "$COOKIE_FILE")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    echo "${GREEN}✓ Authenticated${NC}"
    echo ""
    echo "${BLUE}User Details:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    echo "${RED}✗ Not authenticated${NC}"
    echo ""
    echo "Please login again:"
    echo "  ./shscripts/auth/login.sh ${SERVICE_NAME}"
else
    echo "${RED}✗ Request failed with HTTP code: ${HTTP_CODE}${NC}"
    echo ""
    echo "${BLUE}Response:${NC}"
    echo "$BODY"
fi

exit 0
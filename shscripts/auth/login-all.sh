#!/bin/zsh

# Login all three users sequentially
# Usage: ./login-all.sh [server-url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_URL="${1:-http://localhost:8000}"

echo "${BLUE}=== Login All Users ===${NC}"
echo "Server: ${YELLOW}${SERVER_URL}${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="${0:a:h}"

# Login each user
for i in 1 2 3; do
    SERVICE_NAME="woofmeetup-user${i}"
    
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}Logging in User ${i}${NC}"
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if credentials exist
    if ! security find-generic-password -s "$SERVICE_NAME" 2>/dev/null >/dev/null; then
        echo "${RED}✗ Credentials not found for '${SERVICE_NAME}'${NC}"
        echo "${YELLOW}Run './shscripts/auth/setup-users.sh' to add credentials${NC}"
        echo ""
        continue
    fi
    
    # Run login script
    "${SCRIPT_DIR}/login.sh" "$SERVICE_NAME" "$SERVER_URL"
    
    echo ""
    sleep 1  # Small delay between requests
done

echo "${GREEN}=== All login attempts completed ===${NC}"
echo ""
echo "${BLUE}Session cookies saved to:${NC}"
for i in 1 2 3; do
    COOKIE_FILE="/tmp/woofmeetup_cookies_woofmeetup-user${i}.txt"
    if [ -f "$COOKIE_FILE" ]; then
        echo "  ${GREEN}✓${NC} User ${i}: ${COOKIE_FILE}"
    else
        echo "  ${RED}✗${NC} User ${i}: Not logged in"
    fi
done
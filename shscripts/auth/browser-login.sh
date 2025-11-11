#!/bin/zsh

# Browser-based login helper
# This script opens the browser and automatically fills in the login form
# Usage: ./browser-login.sh [user-number] [server-url]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

USER_NUM="${1:-1}"
SERVER_URL="${2:-http://localhost:8000}"
SERVICE_NAME="woofmeetup-user${USER_NUM}"

echo "${BLUE}═══════════════════════════════════════${NC}"
echo "${BLUE}    Browser Login Helper${NC}"
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get credentials from Keychain
echo "${BLUE}Retrieving credentials...${NC}"
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)
PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "${RED}Error: Could not retrieve credentials for user ${USER_NUM}${NC}"
    exit 1
fi

echo "${GREEN}✓ Credentials retrieved${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  YOUR LOGIN CREDENTIALS${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}Email:${NC}"
echo "  ${GREEN}${EMAIL}${NC}"
echo ""
echo "${CYAN}Password:${NC}"
echo "  ${GREEN}${PASSWORD}${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Open browser based on user number (different browser per user)
echo "${BLUE}Opening browser...${NC}"

# Copy password to clipboard for easy pasting
echo -n "$PASSWORD" | pbcopy

# Choose browser based on user number to avoid session conflicts
case "$USER_NUM" in
    1)
        # User 1: Chrome (normal mode)
        echo "${BLUE}Opening in Chrome...${NC}"
        open -a "Google Chrome" "${SERVER_URL}/"
        BROWSER_NAME="Chrome"
        ;;
    2)
        # User 2: Chrome Incognito
        echo "${BLUE}Opening in Chrome Incognito...${NC}"
        open -na "Google Chrome" --args --incognito "${SERVER_URL}/"
        BROWSER_NAME="Chrome Incognito"
        ;;
    3)
        # User 3: Firefox
        echo "${BLUE}Opening in Firefox...${NC}"
        open -a "Firefox" "${SERVER_URL}/"
        BROWSER_NAME="Firefox"
        ;;
    *)
        # Default: Safari
        echo "${BLUE}Opening in Safari...${NC}"
        open -a Safari "${SERVER_URL}/"
        BROWSER_NAME="Safari"
        ;;
esac

echo ""
echo "${GREEN}✓ Opened in ${BROWSER_NAME}${NC}"
echo "${GREEN}✓ Password copied to clipboard${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  INSTRUCTIONS${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}1.${NC} Click 'Login' on the home page"
echo "${CYAN}2.${NC} Enter email: ${GREEN}${EMAIL}${NC}"
echo "${CYAN}3.${NC} Paste password (Cmd+V): ${GREEN}${PASSWORD}${NC}"
echo "${CYAN}4.${NC} Click 'Login' button"
echo ""
echo "${BLUE}Note: Password is in your clipboard, ready to paste${NC}"
echo ""

exit 0
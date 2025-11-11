#!/bin/zsh

# Quick login helper - shows credentials and opens browser
# Usage: ./quick-login.sh [user-number] [server-url]

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
echo "${BLUE}    Quick Login - User ${USER_NUM}${NC}"
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get credentials from Keychain
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)
PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)
USERNAME=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "0x00000007" | cut -d '=' -f 2 | sed 's/"//g' | xargs || true)

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "${RED}✗ Could not retrieve credentials for '${SERVICE_NAME}'${NC}"
    echo ""
    echo "Run setup-users.sh first to store credentials"
    exit 1
fi

echo "${GREEN}✓ Credentials Retrieved${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  LOGIN CREDENTIALS${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}Email:${NC}"
echo "  ${GREEN}${EMAIL}${NC}"
echo ""
echo "${CYAN}Password:${NC}"
echo "  ${GREEN}${PASSWORD}${NC}"
echo ""
echo "${CYAN}Username:${NC}"
echo "  ${GREEN}${USERNAME}${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Copy email to clipboard first
echo -n "$EMAIL" | pbcopy
echo "${GREEN}✓ Email copied to clipboard${NC}"
echo ""
echo "${BLUE}Opening browser...${NC}"

# Choose browser based on user number
case "$USER_NUM" in
    1)
        echo "${BLUE}Opening in Chrome (normal mode)...${NC}"
        open -a "Google Chrome" "${SERVER_URL}/"
        BROWSER_NAME="Chrome"
        ;;
    2)
        echo "${BLUE}Opening in Chrome Incognito...${NC}"
        open -na "Google Chrome" --args --incognito "${SERVER_URL}/"
        BROWSER_NAME="Chrome Incognito"
        ;;
    3)
        echo "${BLUE}Opening in Firefox...${NC}"
        open -a "Firefox" "${SERVER_URL}/"
        BROWSER_NAME="Firefox"
        ;;
    *)
        echo "${BLUE}Opening in Safari...${NC}"
        open -a Safari "${SERVER_URL}/"
        BROWSER_NAME="Safari"
        ;;
esac

echo ""
echo "${GREEN}✓ Browser opened: ${BROWSER_NAME}${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  INSTRUCTIONS${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}Step 1:${NC} Click 'Login' button on the home page"
echo ""
echo "${CYAN}Step 2:${NC} Paste email in the email field"
echo "  ${GREEN}(Email is already in clipboard)${NC}"
echo ""
echo "${CYAN}Step 3:${NC} Click in password field, then run:"
echo "  ${BLUE}echo -n '${PASSWORD}' | pbcopy${NC}"
echo "  Then paste in the password field"
echo ""
echo "${CYAN}Step 4:${NC} Click 'Login'"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${BLUE}Press Enter when you're ready to copy the password...${NC}"
read

# Copy password to clipboard
echo -n "$PASSWORD" | pbcopy
echo ""
echo "${GREEN}✓ Password copied to clipboard${NC}"
echo "${GREEN}✓ You can now paste it in the browser${NC}"
echo ""
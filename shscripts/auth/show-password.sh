#!/bin/zsh

# Show password for a user (for debugging)
# Usage: ./show-password.sh [user-number]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

USER_NUM="${1:-1}"
SERVICE_NAME="woofmeetup-user${USER_NUM}"

echo "${BLUE}═══════════════════════════════════════${NC}"
echo "${BLUE}    Password Display${NC}"
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Get credentials from Keychain
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)
PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)
USERNAME=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "0x00000007" | cut -d '=' -f 2 | sed 's/"//g' | xargs || true)

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "${RED}✗ Could not retrieve credentials for '${SERVICE_NAME}'${NC}"
    exit 1
fi

echo "${GREEN}Credentials for User ${USER_NUM}:${NC}"
echo ""
echo "${CYAN}Email:${NC}    ${EMAIL}"
echo "${CYAN}Username:${NC} ${USERNAME}"
echo "${CYAN}Password:${NC} ${PASSWORD}"
echo ""
echo "${YELLOW}Password length:${NC} ${#PASSWORD} characters"
echo ""

# Copy to clipboard
echo -n "$PASSWORD" | pbcopy
echo "${GREEN}✓ Password copied to clipboard${NC}"
echo ""
echo "${BLUE}You can now paste it in the browser.${NC}"
echo ""
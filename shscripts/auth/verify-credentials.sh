#!/bin/zsh

# Verify credentials by attempting login
# Usage: ./verify-credentials.sh [user-number] [server-url]

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
API_ENDPOINT="${SERVER_URL}/api/auth"
SERVICE_NAME="woofmeetup-user${USER_NUM}"

echo "${BLUE}═══════════════════════════════════════${NC}"
echo "${BLUE}    Credential Verification${NC}"
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "User: ${YELLOW}User ${USER_NUM}${NC}"
echo "Server: ${YELLOW}${SERVER_URL}${NC}"
echo ""

# Get credentials from Keychain
echo "${BLUE}[1/2] Retrieving credentials from Keychain...${NC}"
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)
PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "${RED}✗ Could not retrieve credentials for '${SERVICE_NAME}'${NC}"
    echo ""
    echo "Run setup-users.sh first to store credentials"
    exit 1
fi

echo "${GREEN}✓ Credentials retrieved from Keychain${NC}"
echo "  Email: ${CYAN}${EMAIL}${NC}"
echo "  Password: ${CYAN}${PASSWORD:0:3}***${NC}"
echo ""

# Test login
echo "${BLUE}[2/2] Testing login...${NC}"
COOKIE_FILE="/tmp/woofmeetup_verify_user${USER_NUM}.txt"
rm -f "$COOKIE_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE" -X POST "${API_ENDPOINT}/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "${GREEN}════════════════════════════════════════${NC}"
    echo "${GREEN}✓ CREDENTIALS ARE VALID!${NC}"
    echo "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo "Your keychain credentials match the database."
    echo "You can use these credentials to log in."
    echo ""
    echo "${CYAN}Email:${NC} ${EMAIL}"
    echo "${CYAN}Password:${NC} (stored in keychain)"
    echo ""
    rm -f "$COOKIE_FILE"
    exit 0
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo "${RED}════════════════════════════════════════${NC}"
    echo "${RED}✗ INVALID CREDENTIALS${NC}"
    echo "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo "${YELLOW}The password in your keychain does NOT match the database.${NC}"
    echo ""
    echo "This can happen if:"
    echo "  1. The account was created with a different password"
    echo "  2. The password was changed after storing in keychain"
    echo "  3. The account doesn't exist yet"
    echo ""
    echo "${BLUE}Response from server:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo "${YELLOW}  SOLUTION OPTIONS:${NC}"
    echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "${CYAN}Option 1: Update keychain with correct password${NC}"
    echo "  1. Delete current keychain entry:"
    echo "     ${BLUE}security delete-generic-password -s ${SERVICE_NAME}${NC}"
    echo "  2. Run setup-users.sh to store the correct password"
    echo ""
    echo "${CYAN}Option 2: Reset the account${NC}"
    echo "  1. Delete the user from database (if you have access)"
    echo "  2. Run signup.sh again to create fresh account"
    echo ""
    echo "${CYAN}Option 3: Update password in database${NC}"
    echo "  Run the password reset flow (if available)"
    echo ""
    exit 1
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "${YELLOW}════════════════════════════════════════${NC}"
    echo "${YELLOW}⚠ ACCOUNT NOT FOUND${NC}"
    echo "${YELLOW}════════════════════════════════════════${NC}"
    echo ""
    echo "The account for ${EMAIL} does not exist in the database."
    echo ""
    echo "${BLUE}To create this account, run:${NC}"
    echo "  ${CYAN}./signup.sh ${USER_NUM}${NC}"
    echo ""
    exit 1
else
    echo "${RED}✗ Unexpected error (HTTP ${HTTP_CODE})${NC}"
    echo ""
    echo "${BLUE}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    exit 1
fi
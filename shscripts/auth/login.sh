#!/bin/zsh

# Interactive login script using macOS Keychain passwords
# Usage: ./login.sh [user-number] [server-url]
#
# Example: ./login.sh 1
# Example: ./login.sh 1 http://localhost:8000
# Or run without arguments to be prompted

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Parse arguments
PRESET_USER_NUM=""
SERVER_URL="http://localhost:8000"

# Check if first argument is a number (user number) or URL
if [[ -n "$1" ]]; then
    if [[ "$1" =~ ^[1-3]$ ]]; then
        # First arg is user number
        PRESET_USER_NUM="$1"
        SERVER_URL="${2:-http://localhost:8000}"
    else
        # First arg is server URL
        SERVER_URL="$1"
    fi
fi

API_ENDPOINT="${SERVER_URL}/api/auth/login"

echo "${BLUE}═══════════════════════════════════════${NC}"
echo "${BLUE}    WoofMeetup Interactive Login${NC}"
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Server: ${YELLOW}${SERVER_URL}${NC}"
echo ""

# Function to check if credentials exist for a user
check_user_exists() {
    local user_num=$1
    local service_name="woofmeetup-user${user_num}"
    security find-generic-password -s "$service_name" 2>/dev/null >/dev/null
    return $?
}

# Function to get user info
get_user_info() {
    local user_num=$1
    local service_name="woofmeetup-user${user_num}"
    local email=$(security find-generic-password -s "$service_name" 2>&1 | grep "acct" | cut -d '"' -f 4 || echo "")
    local username=$(security find-generic-password -s "$service_name" 2>&1 | grep "0x00000007" | cut -d '=' -f 2 | sed 's/"//g' | xargs || echo "N/A")
    
    if [ -n "$email" ]; then
        echo "${email}|${username}"
    else
        echo ""
    fi
}

# Display available users
echo "${CYAN}Available users:${NC}"
echo ""

available_users=()
for i in 1 2 3; do
    if check_user_exists $i; then
        user_info=$(get_user_info $i)
        email=$(echo "$user_info" | cut -d '|' -f 1)
        username=$(echo "$user_info" | cut -d '|' -f 2)
        
        echo "  ${MAGENTA}[$i]${NC} User $i"
        echo "      Email: ${CYAN}${email}${NC}"
        echo "      Username: ${CYAN}${username}${NC}"
        echo ""
        available_users+=($i)
    fi
done

if [ ${#available_users[@]} -eq 0 ]; then
    echo "${RED}No users found in Keychain!${NC}"
    echo ""
    echo "Run ${YELLOW}setup-users.sh${NC} first to store credentials"
    exit 1
fi

# Prompt for user selection (if not provided as argument)
if [[ -n "$PRESET_USER_NUM" ]]; then
    USER_NUM="$PRESET_USER_NUM"
    # Validate preset user number
    if [[ ! " ${available_users[@]} " =~ " ${USER_NUM} " ]]; then
        echo ""
        echo "${RED}Error: Invalid user number '${USER_NUM}'${NC}"
        echo "Please choose from: ${available_users[@]}"
        exit 1
    fi
    echo "${GREEN}Using User ${USER_NUM}${NC}"
    echo ""
else
    echo "${YELLOW}Which user do you want to login as?${NC}"
    echo -n "Enter user number [${available_users[@]}]: "
    read USER_NUM
    
    # Validate input
    if [[ ! " ${available_users[@]} " =~ " ${USER_NUM} " ]]; then
        echo ""
        echo "${RED}Error: Invalid user number '${USER_NUM}'${NC}"
        echo "Please choose from: ${available_users[@]}"
        exit 1
    fi
fi

SERVICE_NAME="woofmeetup-user${USER_NUM}"
COOKIE_FILE="/tmp/woofmeetup_cookies_user${USER_NUM}.txt"

echo ""
echo "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Retrieve credentials from Keychain
echo "${BLUE}[1/2] Retrieving credentials from Keychain...${NC}"
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)

if [ -z "$EMAIL" ]; then
    echo "${RED}Error: Could not find credentials for '${SERVICE_NAME}' in Keychain${NC}"
    exit 1
fi

PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)

if [ -z "$PASSWORD" ]; then
    echo "${RED}Error: Could not retrieve password from Keychain${NC}"
    exit 1
fi

echo "${GREEN}✓ Credentials retrieved${NC}"
echo "  Email: ${CYAN}${EMAIL}${NC}"
echo ""

# Perform login
echo "${BLUE}[2/2] Logging in...${NC}"
rm -f "$COOKIE_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -c "$COOKIE_FILE" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 200 ]; then
    echo "${RED}✗ Login failed with HTTP code: ${HTTP_CODE}${NC}"
    echo ""
    echo "${BLUE}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

echo "${GREEN}✓ Login successful${NC}"
echo ""

# Success summary
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✓ API LOGIN COMPLETE!${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}Logged in as:${NC}"
echo "  Email: ${YELLOW}${EMAIL}${NC}"
echo ""
echo "${CYAN}Session saved to:${NC}"
echo "  ${YELLOW}${COOKIE_FILE}${NC}"
echo ""

# Copy password to clipboard for browser login
echo -n "$PASSWORD" | pbcopy

# Choose browser based on user number to avoid session conflicts
echo "${BLUE}Opening browser...${NC}"
echo "${YELLOW}Note: If you see a blank page or old session, clear browser cookies for localhost:8000${NC}"
echo ""
case "$USER_NUM" in
    1)
        # User 1: Chrome (normal mode)
        open -a "Google Chrome" "${SERVER_URL}/"
        BROWSER_NAME="Chrome"
        ;;
    2)
        # User 2: Chrome Incognito
        open -na "Google Chrome" --args --incognito "${SERVER_URL}/"
        BROWSER_NAME="Chrome Incognito"
        ;;
    3)
        # User 3: Firefox
        open -a "Firefox" "${SERVER_URL}/"
        BROWSER_NAME="Firefox"
        ;;
    *)
        # Default: Safari
        open -a Safari "${SERVER_URL}/"
        BROWSER_NAME="Safari"
        ;;
esac

echo ""
echo "${GREEN}✓ Browser opened in ${BROWSER_NAME}${NC}"
echo "${GREEN}✓ Password copied to clipboard${NC}"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  BROWSER LOGIN INSTRUCTIONS${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}1.${NC} Enter email: ${GREEN}${EMAIL}${NC}"
echo "${CYAN}2.${NC} Paste password (Cmd+V): ${GREEN}[copied to clipboard]${NC}"
echo "${CYAN}3.${NC} Click 'Login' button"
echo ""
echo "${BLUE}Note: Password is in your clipboard, ready to paste${NC}"
echo ""

exit 0
#!/bin/zsh

# Signup script with complete onboarding using macOS Keychain passwords
# Usage: ./signup.sh [1|2|3] [server-url]
#
# Example: ./signup.sh 1
# This will use credentials stored for user 1 (woofmeetup-user1)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if user number is provided
if [ -z "$1" ]; then
    echo "${RED}Error: User number is required${NC}"
    echo "Usage: $0 [1|2|3] [server-url]"
    echo ""
    echo "Example: $0 1"
    echo ""
    echo "First, run setup-users.sh to store credentials in Keychain"
    exit 1
fi

USER_NUM="$1"
SERVICE_NAME="woofmeetup-user${USER_NUM}"

# Default server URL
SERVER_URL="${2:-http://localhost:8000}"
API_ENDPOINT="${SERVER_URL}/api/auth"

echo "${BLUE}=== WoofMeetup Signup & Onboarding Script ===${NC}"
echo "User: ${YELLOW}User ${USER_NUM}${NC}"
echo "Server: ${YELLOW}${SERVER_URL}${NC}"
echo ""

# Retrieve email and username from Keychain
echo "${BLUE}[1/5] Retrieving credentials from Keychain...${NC}"
EMAIL=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "acct" | cut -d '"' -f 4 || true)

if [ -z "$EMAIL" ]; then
    echo "${RED}Error: Could not find credentials for '${SERVICE_NAME}' in Keychain${NC}"
    echo ""
    echo "Run setup-users.sh first to store credentials"
    exit 1
fi

# Retrieve password from Keychain
PASSWORD=$(security find-generic-password -s "$SERVICE_NAME" -w 2>/dev/null || true)

if [ -z "$PASSWORD" ]; then
    echo "${RED}Error: Could not retrieve password from Keychain${NC}"
    exit 1
fi

# Retrieve username from Keychain comment field
USERNAME=$(security find-generic-password -s "$SERVICE_NAME" 2>&1 | grep "0x00000007" | cut -d '=' -f 2 | sed 's/"//g' | xargs || true)

if [ -z "$USERNAME" ]; then
    echo "${YELLOW}Username not found in Keychain. Please enter username:${NC}"
    read USERNAME
    if [ -z "$USERNAME" ]; then
        echo "${RED}Error: Username is required${NC}"
        exit 1
    fi
fi

echo "${GREEN}✓ Credentials retrieved${NC}"
echo "  Email: ${CYAN}${EMAIL}${NC}"
echo "  Username: ${CYAN}${USERNAME}${NC}"
echo ""

# Step 1: Signup
echo "${BLUE}[2/5] Creating account...${NC}"
COOKIE_FILE="/tmp/woofmeetup_cookies_user${USER_NUM}.txt"
rm -f "$COOKIE_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE" -X POST "${API_ENDPOINT}/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"userName\":\"$USERNAME\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 201 ]; then
    if [ "$HTTP_CODE" -eq 409 ]; then
        echo "${YELLOW}⚠ User already exists. Use login script instead.${NC}"
    elif [ "$HTTP_CODE" -eq 400 ]; then
        echo "${RED}✗ Signup failed - Validation error${NC}"
        echo ""
        echo "${YELLOW}Password requirements:${NC}"
        echo "  - Minimum 10 characters"
        echo "  - At least 1 lowercase, 1 uppercase, 1 number, 1 symbol"
    else
        echo "${RED}✗ Signup failed with HTTP code: ${HTTP_CODE}${NC}"
    fi
    echo ""
    echo "${BLUE}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

# Extract user_id and verification token from response
USER_ID=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['user_id'])" 2>/dev/null || true)
VERIFICATION_TOKEN=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['verificationToken'])" 2>/dev/null || true)

if [ -z "$USER_ID" ]; then
    echo "${RED}Error: Could not extract user_id from signup response${NC}"
    exit 1
fi

echo "${GREEN}✓ Account created successfully${NC}"
echo "  User ID: ${CYAN}${USER_ID}${NC}"
echo ""

# Step 2: Complete onboarding
echo "${BLUE}[3/5] Completing onboarding profile...${NC}"
echo ""

# Prompt for dog profile information
echo "${YELLOW}Enter your dog's information:${NC}"
echo ""

# Dog's name
read "DOG_NAME?Dog's name: "
if [ -z "$DOG_NAME" ]; then
    echo "${RED}Error: Dog's name is required${NC}"
    exit 1
fi

# Age
read "AGE?Dog's age: "
if [ -z "$AGE" ]; then
    echo "${RED}Error: Age is required${NC}"
    exit 1
fi

# About
echo "About your dog (press Enter when done):"
read "ABOUT?> "
if [ -z "$ABOUT" ]; then
    echo "${RED}Error: About text is required${NC}"
    exit 1
fi

echo ""

# Meetup type selection
echo "${YELLOW}Choose a Meetup Type:${NC}"
echo "  ${CYAN}1)${NC} Play Dates"
echo "  ${CYAN}2)${NC} Exercise Buddy"
echo "  ${CYAN}3)${NC} Walk Companion"
echo ""
read "MEETUP_TYPE_CHOICE?Select (1-3) [default: 3]: "

case "$MEETUP_TYPE_CHOICE" in
    1)
        MEETUP_TYPE="Play Dates"
        ;;
    2)
        MEETUP_TYPE="Exercise Buddy"
        ;;
    3|"")
        MEETUP_TYPE="Walk Companion"
        ;;
    *)
        echo "${RED}Invalid choice. Using default: Walk Companion${NC}"
        MEETUP_TYPE="Walk Companion"
        ;;
esac

echo "${GREEN}✓ Selected: ${MEETUP_TYPE}${NC}"
echo ""

# Meetup interest selection
echo "${YELLOW}Show Me:${NC}"
echo "  ${CYAN}1)${NC} Play Dates"
echo "  ${CYAN}2)${NC} Exercise Buddy"
echo "  ${CYAN}3)${NC} Walk Companion"
echo "  ${CYAN}4)${NC} Show all meetup activities"
echo ""
read "MEETUP_INTEREST_CHOICE?Select (1-4) [default: 4]: "

case "$MEETUP_INTEREST_CHOICE" in
    1)
        MEETUP_INTEREST="Play Dates"
        ;;
    2)
        MEETUP_INTEREST="Exercise Buddy"
        ;;
    3)
        MEETUP_INTEREST="Walk Companion"
        ;;
    4|"")
        MEETUP_INTEREST="Show all meetup activites"
        ;;
    *)
        echo "${RED}Invalid choice. Using default: Show all meetup activities${NC}"
        MEETUP_INTEREST="Show all meetup activites"
        ;;
esac

echo "${GREEN}✓ Selected: ${MEETUP_INTEREST}${NC}"
echo ""

# Search radius
SEARCH_RADIUS=10

ONBOARD_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X PUT "${API_ENDPOINT}/user" \
    -H "Content-Type: application/json" \
    -d "{\"formData\":{\"user_id\":\"$USER_ID\",\"dogs_name\":\"$DOG_NAME\",\"age\":\"$AGE\",\"show_meetup_type\":false,\"meetup_type\":\"$MEETUP_TYPE\",\"meetup_interest\":\"$MEETUP_INTEREST\",\"about\":\"$ABOUT\",\"matches\":[],\"current_user_search_radius\":$SEARCH_RADIUS}}")

ONBOARD_HTTP_CODE=$(echo "$ONBOARD_RESPONSE" | tail -n1)
ONBOARD_BODY=$(echo "$ONBOARD_RESPONSE" | sed '$d')

if [ "$ONBOARD_HTTP_CODE" -ne 200 ]; then
    echo "${RED}✗ Onboarding failed with HTTP code: ${ONBOARD_HTTP_CODE}${NC}"
    echo ""
    echo "${BLUE}Response:${NC}"
    echo "$ONBOARD_BODY"
    exit 1
fi

echo "${GREEN}✓ Onboarding completed${NC}"
echo "  Dog's Name: ${CYAN}${DOG_NAME}${NC}"
echo "  Age: ${CYAN}${AGE}${NC}"
echo "  About: ${CYAN}${ABOUT}${NC}"
echo ""

# Step 3: Verify email (for testing purposes)
echo "${BLUE}[4/5] Verifying email...${NC}"

# Debug: Show verification token
if [ -z "$VERIFICATION_TOKEN" ]; then
    echo "${RED}✗ Error: No verification token found${NC}"
    echo "${YELLOW}Note: Email verification will be required manually${NC}"
    echo ""
else
    echo "${BLUE}  Using verification token: ${VERIFICATION_TOKEN:0:20}...${NC}"
    
    VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${API_ENDPOINT}/verify-email" \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$VERIFICATION_TOKEN\"}")

    VERIFY_HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
    VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

    if [ "$VERIFY_HTTP_CODE" -ne 200 ]; then
        echo "${RED}✗ Email verification failed (HTTP code: ${VERIFY_HTTP_CODE})${NC}"
        echo "${YELLOW}Response:${NC}"
        echo "$VERIFY_BODY" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_BODY"
        echo ""
        echo "${YELLOW}Note: You may need to verify email manually to access dashboard${NC}"
    else
        echo "${GREEN}✓ Email verified successfully${NC}"
    fi
fi
echo ""

# Step 4: Upload images (optional)
echo "${BLUE}[5/5] Uploading images...${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_IMAGES_DIR="${SCRIPT_DIR}/../test-images"

# Dog image upload
DOG_IMAGE_PATH="${TEST_IMAGES_DIR}/dogs/dog${USER_NUM}.jpg"
if [ ! -f "$DOG_IMAGE_PATH" ]; then
    # Try PNG format
    DOG_IMAGE_PATH="${TEST_IMAGES_DIR}/dogs/dog${USER_NUM}.png"
fi

if [ -f "$DOG_IMAGE_PATH" ]; then
    echo "${BLUE}  Uploading dog image...${NC}"
    
    DOG_IMAGE_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X PUT "${API_ENDPOINT}/image" \
        -F "image=@${DOG_IMAGE_PATH}" \
        -F "UserId=${USER_ID}")
    
    DOG_IMAGE_HTTP_CODE=$(echo "$DOG_IMAGE_RESPONSE" | tail -n1)
    
    if [ "$DOG_IMAGE_HTTP_CODE" -eq 200 ]; then
        echo "${GREEN}  ✓ Dog image uploaded successfully${NC}"
    else
        echo "${YELLOW}  ⚠ Dog image upload failed (HTTP ${DOG_IMAGE_HTTP_CODE})${NC}"
    fi
else
    echo "${YELLOW}  ⚠ No dog image found at: ${DOG_IMAGE_PATH}${NC}"
    echo "${BLUE}    To add images, place them in: ${TEST_IMAGES_DIR}/dogs/${NC}"
fi

echo ""

# Profile image upload
PROFILE_IMAGE_PATH="${TEST_IMAGES_DIR}/profiles/profile${USER_NUM}.jpg"
if [ ! -f "$PROFILE_IMAGE_PATH" ]; then
    # Try PNG format
    PROFILE_IMAGE_PATH="${TEST_IMAGES_DIR}/profiles/profile${USER_NUM}.png"
fi

if [ -f "$PROFILE_IMAGE_PATH" ]; then
    echo "${BLUE}  Uploading profile image...${NC}"
    
    PROFILE_IMAGE_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X PUT "${API_ENDPOINT}/profile-image" \
        -F "image=@${PROFILE_IMAGE_PATH}" \
        -F "UserId=${USER_ID}")
    
    PROFILE_IMAGE_HTTP_CODE=$(echo "$PROFILE_IMAGE_RESPONSE" | tail -n1)
    
    if [ "$PROFILE_IMAGE_HTTP_CODE" -eq 200 ]; then
        echo "${GREEN}  ✓ Profile image uploaded successfully${NC}"
    else
        echo "${YELLOW}  ⚠ Profile image upload failed (HTTP ${PROFILE_IMAGE_HTTP_CODE})${NC}"
    fi
else
    echo "${YELLOW}  ⚠ No profile image found at: ${PROFILE_IMAGE_PATH}${NC}"
    echo "${BLUE}    To add images, place them in: ${TEST_IMAGES_DIR}/profiles/${NC}"
fi

echo ""

# Success summary
echo "${GREEN}════════════════════════════════════════${NC}"
echo "${GREEN}✓ SIGNUP & ONBOARDING COMPLETE!${NC}"
echo "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "${CYAN}Account Details:${NC}"
echo "  Email: ${YELLOW}${EMAIL}${NC}"
echo "  Username: ${YELLOW}${USERNAME}${NC}"
echo "  Dog's Name: ${YELLOW}${DOG_NAME}${NC}"
echo "  Meetup Type: ${YELLOW}${MEETUP_TYPE}${NC}"
echo "  Meetup Interest: ${YELLOW}${MEETUP_INTEREST}${NC}"
echo ""
echo "${CYAN}API Session saved to:${NC}"
echo "  ${YELLOW}${COOKIE_FILE}${NC}"
echo ""

# Prompt to open browser
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo "${YELLOW}  🌐 Browser Login${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Your account is ready! Would you like to open the browser"
echo "and log in now?"
echo ""
echo -n "${CYAN}Open browser? [Y/n]:${NC} "
read OPEN_BROWSER

if [[ "$OPEN_BROWSER" =~ ^[Nn] ]]; then
    echo ""
    echo "${BLUE}Skipping browser login.${NC}"
    echo ""
    echo "To log in later, run:"
    echo "  ${CYAN}./shscripts/auth/browser-login.sh ${USER_NUM}${NC}"
    echo ""
else
    echo ""
    # Open browser based on user number (different browser per user)
    echo "${BLUE}Opening browser...${NC}"
    
    # Copy password to clipboard
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
    
    echo "${GREEN}✓ Opened in ${BROWSER_NAME}${NC}"
    echo "${GREEN}✓ Password copied to clipboard${NC}"
    echo ""
    
    # Different instructions based on user number
    if [ "$USER_NUM" -eq 1 ]; then
        echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo "${YELLOW}  LOGIN INSTRUCTIONS${NC}"
        echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo ""
        echo "${CYAN}1.${NC} Click 'Login' on the home page"
        echo "${CYAN}2.${NC} Enter email: ${GREEN}${EMAIL}${NC}"
        echo "${CYAN}3.${NC} Paste password (Cmd+V): ${GREEN}${PASSWORD}${NC}"
        echo "${CYAN}4.${NC} Click 'Login' button"
        echo ""
        echo "${BLUE}Note: Password is in your clipboard, ready to paste${NC}"
        echo ""
    else
        echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo "${YELLOW}  LOGIN INSTRUCTIONS${NC}"
        echo "${YELLOW}═══════════════════════════════════════════════════${NC}"
        echo ""
        echo "${BLUE}Browser will redirect to login page...${NC}"
        echo ""
        echo "${CYAN}1.${NC} Enter email: ${GREEN}${EMAIL}${NC}"
        echo "${CYAN}2.${NC} Paste password (Cmd+V): ${GREEN}${PASSWORD}${NC}"
        echo "${CYAN}3.${NC} Click 'Login' button"
        echo ""
        echo "${BLUE}Note: Password is in your clipboard, ready to paste${NC}"
        echo ""
    fi
fi

exit 0
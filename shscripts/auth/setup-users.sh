#!/bin/zsh

# Helper script to set up three test users in macOS Keychain
# This script will prompt you for credentials and store them securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}=== WoofMeetup User Setup ===${NC}"
echo ""
echo "This script will help you store credentials for 3 users in macOS Keychain."
echo "You'll be prompted to enter email and password for each user."
echo ""

# Function to add user to keychain
add_user() {
    local user_num=$1
    local service_name="woofmeetup-user${user_num}"
    
    echo "${BLUE}--- User ${user_num} ---${NC}"
    
    # Check if already exists
    if security find-generic-password -s "$service_name" 2>/dev/null >/dev/null; then
        echo "${YELLOW}Credentials for '${service_name}' already exist in Keychain.${NC}"
        echo "Do you want to update them? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            security delete-generic-password -s "$service_name"
            echo "${GREEN}Deleted existing credentials${NC}"
        else
            echo "${YELLOW}Skipping user ${user_num}${NC}"
            echo ""
            return
        fi
    fi
    
    # Get email
    echo "Enter email for user ${user_num}:"
    read email
    
    if [ -z "$email" ]; then
        echo "${RED}Email cannot be empty. Skipping user ${user_num}${NC}"
        echo ""
        return
    fi
    
    # Get username
    echo "Enter username for user ${user_num}:"
    read username
    
    if [ -z "$username" ]; then
        echo "${RED}Username cannot be empty. Skipping user ${user_num}${NC}"
        echo ""
        return
    fi
    
    # Get password (hidden input)
    echo "Enter password for user ${user_num}:"
    echo "${YELLOW}(Password requirements: min 10 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)${NC}"
    read -s password
    echo ""
    
    if [ -z "$password" ]; then
        echo "${RED}Password cannot be empty. Skipping user ${user_num}${NC}"
        echo ""
        return
    fi
    
    # Confirm password
    echo "Confirm password:"
    read -s password_confirm
    echo ""
    
    if [ "$password" != "$password_confirm" ]; then
        echo "${RED}Passwords don't match. Skipping user ${user_num}${NC}"
        echo ""
        return
    fi
    
    # Add to keychain with username in comment field
    security add-generic-password -a "$email" -s "$service_name" -w "$password" -j "$username"
    
    echo "${GREEN}✓ Credentials stored successfully for '${service_name}'${NC}"
    echo "  Email: ${email}"
    echo "  Username: ${username}"
    echo "  Service: ${service_name}"
    echo ""
}

# Add three users
add_user 1
add_user 2
add_user 3

echo "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "${BLUE}Your credentials are now stored in macOS Keychain.${NC}"
echo ""
echo "To signup users (with automatic onboarding), run:"
echo "  ./shscripts/auth/signup.sh 1"
echo "  ./shscripts/auth/signup.sh 2"
echo "  ./shscripts/auth/signup.sh 3"
echo ""
echo "To login users (interactive), run:"
echo "  ./shscripts/auth/login.sh"
echo ""
echo "To view stored credentials:"
echo "  security find-generic-password -s woofmeetup-user1"
echo ""
echo "To delete credentials:"
echo "  security delete-generic-password -s woofmeetup-user1"
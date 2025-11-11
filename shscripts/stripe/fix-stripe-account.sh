#!/bin/bash

# ============================================================================
# STRIPE ACCOUNT FIX SCRIPT
# ============================================================================
# This script will:
# 1. Stop all running processes (server, client, Stripe CLI)
# 2. Guide you through re-authenticating Stripe CLI with the correct account
# 3. Update the webhook secret in .env
# 4. Restart everything with proper logging
# ============================================================================

set -e  # Exit on error

PROJECT_ROOT="/Users/kurt/code/woof-meetup"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         STRIPE ACCOUNT FIX & RESTART SCRIPT                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STEP 1: Stop all running processes
# ============================================================================
echo -e "${YELLOW}[STEP 1/5] Stopping all running processes...${NC}"
echo ""

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local name=$2
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${BLUE}→${NC} Killing $name on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "  ${GREEN}✓${NC} $name stopped"
    else
        echo -e "  ${GREEN}✓${NC} No $name process found on port $port"
    fi
}

# Kill server (port 8000)
kill_port 8000 "Server"

# Kill client (port 5173)
kill_port 5173 "Client"

# Kill Stripe CLI processes
echo -e "  ${BLUE}→${NC} Stopping Stripe CLI..."
pkill -f "stripe listen" 2>/dev/null || true
sleep 1
echo -e "  ${GREEN}✓${NC} Stripe CLI stopped"

echo ""
echo -e "${GREEN}✓ All processes stopped${NC}"
echo ""

# ============================================================================
# STEP 2: Show current Stripe configuration
# ============================================================================
echo -e "${YELLOW}[STEP 2/5] Current Stripe Configuration${NC}"
echo ""

# Extract account ID from the API key in .env
CURRENT_API_KEY=$(grep "STRIPE_SECRET_KEY=" .env | cut -d'=' -f2)
ACCOUNT_ID_FROM_KEY=$(echo "$CURRENT_API_KEY" | sed 's/sk_test_5//' | cut -c1-16)

echo -e "  ${BLUE}API Key Account ID:${NC} acct_$ACCOUNT_ID_FROM_KEY"
echo -e "  ${BLUE}API Key (first 30 chars):${NC} ${CURRENT_API_KEY:0:30}..."
echo ""

# Check current Stripe CLI account
echo -e "  ${BLUE}→${NC} Checking current Stripe CLI authentication..."
CURRENT_CLI_ACCOUNT=$(stripe config --list 2>/dev/null | grep "account_id" | awk '{print $3}' | tr -d "'" || echo "Not authenticated")
echo -e "  ${BLUE}CLI Account ID:${NC} $CURRENT_CLI_ACCOUNT"
echo ""

if [[ "$CURRENT_CLI_ACCOUNT" == "acct_$ACCOUNT_ID_FROM_KEY" ]]; then
    echo -e "${GREEN}✓ CLI is already authenticated with the correct account!${NC}"
    echo -e "${YELLOW}  However, we'll re-authenticate to ensure everything is fresh.${NC}"
else
    echo -e "${RED}✗ CLI is authenticated with WRONG account!${NC}"
    echo -e "  ${YELLOW}Expected:${NC} acct_$ACCOUNT_ID_FROM_KEY"
    echo -e "  ${YELLOW}Current:${NC}  $CURRENT_CLI_ACCOUNT"
fi
echo ""

# ============================================================================
# STEP 3: Re-authenticate Stripe CLI
# ============================================================================
echo -e "${YELLOW}[STEP 3/5] Re-authenticate Stripe CLI${NC}"
echo ""
echo -e "${CYAN}IMPORTANT:${NC} When the browser opens, make sure you log in with the"
echo -e "           Stripe account that owns this API key:"
echo -e "           ${GREEN}acct_$ACCOUNT_ID_FROM_KEY${NC}"
echo ""
echo -e "${YELLOW}Press ENTER to open browser for Stripe authentication...${NC}"
read -r

# Logout first to ensure clean state
stripe logout 2>/dev/null || true

# Login
echo -e "  ${BLUE}→${NC} Opening browser for authentication..."
stripe login

echo ""
echo -e "${GREEN}✓ Stripe CLI authenticated${NC}"
echo ""

# Verify the account
NEW_CLI_ACCOUNT=$(stripe config --list 2>/dev/null | grep "account_id" | awk '{print $3}' | tr -d "'" || echo "Unknown")
echo -e "  ${BLUE}New CLI Account ID:${NC} $NEW_CLI_ACCOUNT"

if [[ "$NEW_CLI_ACCOUNT" == "acct_$ACCOUNT_ID_FROM_KEY" ]]; then
    echo -e "${GREEN}✓ SUCCESS! CLI is now authenticated with the correct account!${NC}"
else
    echo -e "${RED}✗ WARNING: CLI account ($NEW_CLI_ACCOUNT) doesn't match API key account (acct_$ACCOUNT_ID_FROM_KEY)${NC}"
    echo -e "${YELLOW}  This may cause webhook forwarding issues. Consider re-running this script.${NC}"
fi
echo ""

# ============================================================================
# STEP 4: Start Stripe CLI and update webhook secret
# ============================================================================
echo -e "${YELLOW}[STEP 4/5] Starting Stripe CLI and updating webhook secret${NC}"
echo ""

# Clear old log
> stripe-cli.log

# Start Stripe CLI in background and capture output
echo -e "  ${BLUE}→${NC} Starting Stripe CLI webhook forwarding..."
stripe listen --forward-to localhost:8000/api/payments/webhook > stripe-cli.log 2>&1 &
STRIPE_PID=$!

# Wait for webhook secret to appear in log
echo -e "  ${BLUE}→${NC} Waiting for webhook secret..."
sleep 3

# Extract webhook secret from log
WEBHOOK_SECRET=$(grep -o "whsec_[a-zA-Z0-9]*" stripe-cli.log | head -1 || echo "")

if [ -z "$WEBHOOK_SECRET" ]; then
    echo -e "${RED}✗ Failed to get webhook secret from Stripe CLI${NC}"
    echo -e "${YELLOW}  Check stripe-cli.log for details${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Webhook secret obtained: ${WEBHOOK_SECRET:0:20}..."
echo ""

# Update .env file with new webhook secret
echo -e "  ${BLUE}→${NC} Updating .env with new webhook secret..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
else
    # Linux
    sed -i "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
fi

echo -e "  ${GREEN}✓${NC} .env updated with new webhook secret"
echo ""
echo -e "${GREEN}✓ Stripe CLI running (PID: $STRIPE_PID)${NC}"
echo ""

# ============================================================================
# STEP 5: Start server and client
# ============================================================================
echo -e "${YELLOW}[STEP 5/5] Starting server and client${NC}"
echo ""

# Clear old logs
> server.log
> client.log

# Start server
echo -e "  ${BLUE}→${NC} Starting server on port 8000..."
cd "$PROJECT_ROOT"
nohup node server/index.js > server.log 2>&1 &
SERVER_PID=$!
echo -e "  ${GREEN}✓${NC} Server starting (PID: $SERVER_PID)"

# Wait for server to be ready
sleep 3

# Start client
echo -e "  ${BLUE}→${NC} Starting client on port 5173..."
cd "$PROJECT_ROOT/client"
nohup npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
echo -e "  ${GREEN}✓${NC} Client starting (PID: $CLIENT_PID)"

# Wait for client to be ready
sleep 3

echo ""
echo -e "${GREEN}✓ All services started${NC}"
echo ""

# ============================================================================
# FINAL STATUS
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    SETUP COMPLETE! 🎉                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}All services are now running:${NC}"
echo ""
echo -e "  ${BLUE}Server:${NC}      http://localhost:8000 (PID: $SERVER_PID)"
echo -e "  ${BLUE}Client:${NC}      http://localhost:5173 (PID: $CLIENT_PID)"
echo -e "  ${BLUE}Stripe CLI:${NC}  Forwarding to localhost:8000/api/payments/webhook (PID: $STRIPE_PID)"
echo ""
echo -e "${YELLOW}Stripe Configuration:${NC}"
echo -e "  ${BLUE}CLI Account:${NC}    $NEW_CLI_ACCOUNT"
echo -e "  ${BLUE}API Account:${NC}    acct_$ACCOUNT_ID_FROM_KEY"
echo -e "  ${BLUE}Webhook Secret:${NC} ${WEBHOOK_SECRET:0:20}..."
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:5173${NC} in your browser"
echo -e "  2. Navigate to the pricing/credits page"
echo -e "  3. Complete a test purchase"
echo -e "  4. Watch the logs to see webhook events"
echo ""
echo -e "${CYAN}View Logs:${NC}"
echo -e "  ${BLUE}All logs:${NC}        ./watch-webhooks-live.sh"
echo -e "  ${BLUE}Server only:${NC}     tail -f server.log"
echo -e "  ${BLUE}Client only:${NC}     tail -f client.log"
echo -e "  ${BLUE}Stripe CLI only:${NC} tail -f stripe-cli.log"
echo ""
echo -e "${CYAN}Test Webhook:${NC}"
echo -e "  ${BLUE}Trigger test:${NC}    stripe trigger checkout.session.completed"
echo ""
echo -e "${GREEN}Happy testing! 🐕${NC}"
echo ""
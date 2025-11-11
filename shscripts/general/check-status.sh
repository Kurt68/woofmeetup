#!/bin/bash

# ============================================================================
# STATUS CHECK SCRIPT
# ============================================================================
# Quickly check the status of all services and Stripe configuration
# ============================================================================

PROJECT_ROOT="/Users/kurt/code/woof-meetup"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    SERVICE STATUS CHECK                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect mode based on what's actually running
CLIENT_PID=$(lsof -ti:5173 2>/dev/null || echo "")
if [ -n "$CLIENT_PID" ]; then
    # If Vite dev server is running on 5173, we're in development mode
    MODE="development"
elif [ -d "$PROJECT_ROOT/client/dist" ] && [ -n "$(ls -A $PROJECT_ROOT/client/dist 2>/dev/null)" ]; then
    # If no dev server but dist exists, we're in production mode
    MODE="production"
else
    # Default to development if nothing is running
    MODE="development"
fi

echo -e "${YELLOW}Mode:${NC} ${BLUE}$MODE${NC}"
echo ""

# Check server
echo -e "${YELLOW}Server (port 8000):${NC}"
SERVER_PID=$(lsof -ti:8000 2>/dev/null || echo "")
if [ -n "$SERVER_PID" ]; then
    echo -e "  ${GREEN}✓ Running${NC} (PID: $SERVER_PID)"
    if [ "$MODE" = "production" ]; then
        echo -e "  ${BLUE}ℹ Serving built client from /client/dist${NC}"
    fi
else
    echo -e "  ${RED}✗ Not running${NC}"
fi
echo ""

# Check client (development only)
if [ "$MODE" = "development" ]; then
    echo -e "${YELLOW}Client Dev Server (port 5173):${NC}"
    CLIENT_PID=$(lsof -ti:5173 2>/dev/null || echo "")
    if [ -n "$CLIENT_PID" ]; then
        echo -e "  ${GREEN}✓ Running${NC} (PID: $CLIENT_PID)"
    else
        echo -e "  ${RED}✗ Not running${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}Client:${NC}"
    if [ -d "$PROJECT_ROOT/client/dist" ]; then
        echo -e "  ${GREEN}✓ Built${NC} (static files in /client/dist)"
        echo -e "  ${BLUE}ℹ Served by Express on port 8000${NC}"
    else
        echo -e "  ${RED}✗ Not built${NC}"
        echo -e "  ${YELLOW}Run 'npm run build' to build client${NC}"
    fi
    echo ""
fi

# Check Stripe CLI
echo -e "${YELLOW}Stripe CLI:${NC}"
STRIPE_PID=$(pgrep -f "stripe listen" 2>/dev/null || echo "")
if [ -n "$STRIPE_PID" ]; then
    echo -e "  ${GREEN}✓ Running${NC} (PID: $STRIPE_PID)"
else
    echo -e "  ${RED}✗ Not running${NC}"
fi
echo ""

# Check Stripe configuration
echo -e "${YELLOW}Stripe Configuration:${NC}"

# Extract account ID from API key
CURRENT_API_KEY=$(grep "STRIPE_SECRET_KEY=" .env | cut -d'=' -f2)
ACCOUNT_ID_FROM_KEY=$(echo "$CURRENT_API_KEY" | sed 's/sk_test_51//' | cut -c1-16)
echo -e "  ${BLUE}API Key Account:${NC} acct_$ACCOUNT_ID_FROM_KEY"

# Check CLI account
CLI_ACCOUNT=$(stripe config --list 2>/dev/null | grep "account_id" | awk '{print $3}' || echo "Not authenticated")
echo -e "  ${BLUE}CLI Account:${NC}     $CLI_ACCOUNT"

# Check if they match
if [[ "$CLI_ACCOUNT" == "acct_$ACCOUNT_ID_FROM_KEY" ]]; then
    echo -e "  ${GREEN}✓ Accounts match!${NC}"
else
    echo -e "  ${RED}✗ Account mismatch!${NC}"
    echo -e "    ${YELLOW}Run ./fix-stripe-account.sh to fix this${NC}"
fi
echo ""

# Check webhook secret
WEBHOOK_SECRET=$(grep "STRIPE_WEBHOOK_SECRET=" .env | cut -d'=' -f2)
echo -e "  ${BLUE}Webhook Secret:${NC}  ${WEBHOOK_SECRET:0:20}..."
echo ""

# URLs
echo -e "${YELLOW}URLs:${NC}"
if [ "$MODE" = "development" ]; then
    echo -e "  ${BLUE}Client:${NC}  http://localhost:5173"
    echo -e "  ${BLUE}Server:${NC}  http://localhost:8000"
else
    echo -e "  ${BLUE}App:${NC}     http://localhost:8000"
fi
echo -e "  ${BLUE}Webhook:${NC} http://localhost:8000/api/payments/webhook"
echo ""

# Quick actions
echo -e "${CYAN}Quick Actions:${NC}"
echo -e "  ${BLUE}Stop all:${NC}        ./stop-all.sh"
echo -e "  ${BLUE}Fix Stripe:${NC}      ./fix-stripe-account.sh"
echo -e "  ${BLUE}Watch logs:${NC}      ./watch-webhooks-live.sh"
echo -e "  ${BLUE}Test webhook:${NC}    stripe trigger checkout.session.completed"
echo ""
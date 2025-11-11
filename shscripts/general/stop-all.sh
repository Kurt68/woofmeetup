#!/bin/bash

# ============================================================================
# STOP ALL SERVICES SCRIPT
# ============================================================================
# Quickly stops all running services (server, client, Stripe CLI)
# ============================================================================

PROJECT_ROOT="/Users/kurt/code/woof-meetup"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Stopping all services...${NC}"
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
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
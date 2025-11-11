#!/bin/bash

################################################################################
# MongoDB Atlas Security Setup Automation Script
# 
# This script helps configure MongoDB Atlas security for Woof Meetup
# 
# NOTE: Many MongoDB Atlas operations require manual configuration via the
# web dashboard. This script provides:
# 1. Interactive setup wizard
# 2. Connection string validation
# 3. Environment variable management
# 4. Pre-flight checks
#
# Usage: ./shscripts/mongodb/setup-security.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
ENV_FILE="$PROJECT_ROOT/.env"
ENV_PROD_FILE="$PROJECT_ROOT/.env.production"
ENV_DEV_FILE="$PROJECT_ROOT/.env.development"

################################################################################
# Utility Functions
################################################################################

print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

# Validate MongoDB connection string
validate_connection_string() {
  local uri=$1
  
  # Check format
  if [[ ! $uri =~ ^mongodb\+srv:// ]]; then
    print_error "Connection string must use mongodb+srv:// (TLS enabled)"
    return 1
  fi
  
  # Check for credentials
  if [[ ! $uri =~ @.*mongodb\.net ]]; then
    print_error "Invalid connection string format"
    return 1
  fi
  
  print_success "Connection string format is valid"
  return 0
}

# Test MongoDB connection
test_mongodb_connection() {
  local uri=$1
  
  print_info "Testing MongoDB connection..."
  
  # Create a Node.js script to test connection in project directory
  # This ensures node_modules can be resolved
  cat > "$PROJECT_ROOT/.test-mongo.js" << 'EOF'
import { MongoClient } from 'mongodb';

const uri = process.argv[2];  // argv[0] is node, argv[1] is script name, argv[2] is first argument
if (!uri) {
  console.error('❌ No connection string provided');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
});

try {
  await client.connect();
  console.log('✅ Connection successful');
  
  // Get server info
  const admin = client.db().admin();
  const info = await admin.serverInfo();
  console.log('✅ MongoDB version:', info.version);
  
  // List databases
  const dbs = await admin.listDatabases();
  console.log('✅ Databases found:', dbs.databases.length);
  
  await client.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
EOF
  
  # Run from project root so node_modules can be resolved
  (cd "$PROJECT_ROOT" && node .test-mongo.js "$uri" 2>&1)
  local result=$?
  
  # Clean up
  rm -f "$PROJECT_ROOT/.test-mongo.js"
  
  return $result
}

# Extract connection details from URI
extract_connection_details() {
  local uri=$1
  
  # Extract username (before first colon)
  local user=$(echo "$uri" | sed -E 's/^mongodb\+srv:\/\/([^:]+).*/\1/')
  
  # Extract host (between @ and first slash or ?)
  local host=$(echo "$uri" | sed -E 's/.*@([^/?]+).*/\1/')
  
  # Extract database
  local db=$(echo "$uri" | sed -E 's/.*\/([^?]+).*/\1/')
  
  echo "User: $user"
  echo "Host: $host"
  echo "Database: $db"
}

################################################################################
# Main Menu
################################################################################

show_main_menu() {
  print_header "MongoDB Atlas Security Setup"
  
  echo ""
  echo "Choose what you want to do:"
  echo ""
  echo "  1) 📋 View MongoDB Security Checklist"
  echo "  2) 🔐 Configure Production Environment"
  echo "  3) 🛠️  Configure Development Environment"
  echo "  4) ✅ Validate Connection String"
  echo "  5) 🧪 Test MongoDB Connection"
  echo "  6) 📊 View Current Configuration"
  echo "  7) 🚀 Setup Monitoring & Alerts"
  echo "  8) 📖 Open Security Documentation"
  echo "  9) 🔄 Reset to Default (dev) Configuration"
  echo "  0) ❌ Exit"
  echo ""
  read -p "Enter your choice (0-9): " choice
  
  case $choice in
    1) show_security_checklist ;;
    2) setup_production ;;
    3) setup_development ;;
    4) validate_uri ;;
    5) test_connection ;;
    6) show_configuration ;;
    7) show_monitoring_guide ;;
    8) open_docs ;;
    9) reset_to_dev ;;
    0) print_info "Exiting. Goodbye!"; exit 0 ;;
    *) print_error "Invalid choice. Please try again."; sleep 1; show_main_menu ;;
  esac
  
  echo ""
  read -p "Press Enter to return to menu..."
  show_main_menu
}

################################################################################
# Menu Options
################################################################################

show_security_checklist() {
  print_header "🔒 MongoDB Security Checklist"
  
  cat << 'EOF'
DATABASE USER AUTHENTICATION
────────────────────────────────────────────────────────────────
☐ Production user created (woofmeetup-prod)
  Location: MongoDB Atlas Dashboard → Security → Database Access
  Requirements:
    • Strong password (32+ characters)
    • Mix of upper, lower, numbers, symbols
    • Stored in password manager
    • Different from development user
  
☐ Development user created (woofmeetup-dev) (optional)
  • Can have different password
  • Development-only privileges OK
  
☐ Password rotation policy set
  • Rotate every 90 days
  • Store previous passwords for rollback

NETWORK IP WHITELIST
────────────────────────────────────────────────────────────────
☐ Development IP Access (localhost only)
  Location: MongoDB Atlas Dashboard → Security → Network Access
  
  FOR LOCAL DEVELOPMENT:
  • Add: 0.0.0.0/0 (allows any IP)
  • Comment: "Development - local testing"
  ⚠️  MUST BE REMOVED before production!

☐ Production IP Whitelist
  Location: MongoDB Atlas Dashboard → Security → Network Access
  
  Requirements:
  • Remove 0.0.0.0/0
  • Add only production server IP(s):
    ✓ Your server public IP: _______________
    ✓ CI/CD pipeline IP (if needed): _______________
  • Use /32 CIDR notation for exact IPs
  • Document all approved IPs

ENCRYPTED CONNECTIONS (TLS)
────────────────────────────────────────────────────────────────
☑️  Connection string uses mongodb+srv://
    ✓ Automatically enables TLS encryption
    ✓ Certificate validation enabled
    ✓ TLS 1.2+ enforced
    
Status: ✅ ACTIVE (no action needed)

Optional: Mutual TLS (mTLS)
☐ Mutual TLS enabled (for extra security)
  Location: MongoDB Atlas Dashboard → Security → Advanced Settings
  Recommended for: Regulated industries, top-tier security

AUTOMATED BACKUPS
────────────────────────────────────────────────────────────────
☐ Backup schedule configured
  
  DEVELOPMENT:
  • Interval: Every 24 hours
  • Retention: 7 days minimum
  
  PRODUCTION:
  • Interval: Every 6 hours (recommended)
  • Retention: 30-90 days (depends on needs)
  • Backup window: Off-peak (e.g., 2-4 AM)
  
  Location: MongoDB Atlas Dashboard → Backup → Backup Settings

☐ Backup encryption verified
  Location: MongoDB Atlas Dashboard → Backup → Backup Settings
  Status: ✅ AWS KMS (default, active)

☐ Restore tested
  • Create test restore to new cluster
  • Verify data integrity
  • Document restore procedure

ENCRYPTION AT REST
────────────────────────────────────────────────────────────────
☑️  Default encryption active
    ✓ AWS KMS encryption enabled
    ✓ Automatic key rotation
    
Status: ✅ ACTIVE (no action needed)

Optional: Bring Your Own Key (BYOK)
☐ Custom encryption key configured
  Location: MongoDB Atlas Dashboard → Security → Advanced Settings
  Recommended for: High compliance requirements (HIPAA, PCI-DSS)

ADDITIONAL SECURITY
────────────────────────────────────────────────────────────────
☐ Audit logging enabled
  Location: MongoDB Atlas Dashboard → Security → Audit Logs

☐ Alert policies configured for:
  • Connection exceeded
  • Replication lag
  • Backup failures
  • High CPU/memory

☐ Database activity monitoring
  • Track authentication attempts
  • Monitor failed access
  • Alert on anomalies

☐ Environment variables secured
  • MONGODB_URI in .env (development only)
  • MONGODB_URI in .env.production (production)
  • Never commit credentials to git
  • Use password manager for backups

DEPLOYMENT CHECKLIST
────────────────────────────────────────────────────────────────
Before going to production:

☐ All above items checked
☐ Connection tested with production URI
☐ Production user password set
☐ IP whitelist configured for production
☐ Backups working and tested
☐ Monitoring alerts active
☐ Team trained on backup/restore
☐ Disaster recovery plan documented
☐ 0.0.0.0/0 removed from IP whitelist
☐ NODE_ENV=production set in production
EOF
  
  echo ""
  echo -e "${GREEN}For detailed instructions, see: docs/MONGODB_SECURITY.md${NC}"
}

setup_production() {
  print_header "⚙️  Production Environment Setup"
  
  echo ""
  echo "This will help you configure MongoDB for production."
  echo ""
  print_warning "Make sure you have:"
  echo "  1. Production MongoDB Atlas cluster created"
  echo "  2. Production database user created (woofmeetup-prod)"
  echo "  3. Production server public IP ready"
  echo ""
  
  read -p "Have you completed the above? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Skipping production setup"
    return
  fi
  
  echo ""
  read -p "Enter your production MongoDB connection string: " mongo_uri
  
  if ! validate_connection_string "$mongo_uri"; then
    return
  fi
  
  extract_connection_details "$mongo_uri"
  
  echo ""
  read -p "Is this correct? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Cancelled"
    return
  fi
  
  # Save to production env file
  if [ -f "$ENV_PROD_FILE" ]; then
    print_warning "Production env file already exists, backing up..."
    cp "$ENV_PROD_FILE" "${ENV_PROD_FILE}.backup"
  fi
  
  echo "MONGODB_URI=$mongo_uri" > "$ENV_PROD_FILE"
  echo "NODE_ENV=production" >> "$ENV_PROD_FILE"
  echo "MONGODB_MAX_POOL_SIZE=10" >> "$ENV_PROD_FILE"
  echo "MONGODB_TIMEOUT_MS=5000" >> "$ENV_PROD_FILE"
  
  print_success "Production environment configured!"
  print_info "File: $ENV_PROD_FILE"
  echo ""
  
  read -p "Test connection now? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if test_mongodb_connection "$mongo_uri"; then
      print_success "Connection successful!"
    else
      print_error "Connection failed. Check your connection string."
    fi
  fi
}

setup_development() {
  print_header "🛠️  Development Environment Setup"
  
  echo ""
  echo "This will configure MongoDB for local development."
  echo ""
  print_info "You can use:"
  echo "  1. Local MongoDB (mongodb://localhost:27017)"
  echo "  2. MongoDB Atlas with dev user (mongodb+srv://...)"
  echo ""
  
  read -p "Enter your development MongoDB connection string: " mongo_uri
  
  if ! validate_connection_string "$mongo_uri"; then
    print_warning "Note: Local MongoDB uses mongodb://, not mongodb+srv://"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      return
    fi
  fi
  
  # Save to both .env and .env.development
  echo "MONGODB_URI=$mongo_uri" > "$ENV_DEV_FILE"
  echo "NODE_ENV=development" >> "$ENV_DEV_FILE"
  
  # Also update .env if not in production
  if ! grep -q "NODE_ENV=production" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^MONGODB_URI=.*|MONGODB_URI=$mongo_uri|" "$ENV_FILE"
  fi
  
  print_success "Development environment configured!"
  print_info "File: $ENV_DEV_FILE"
  
  read -p "Test connection now? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if test_mongodb_connection "$mongo_uri"; then
      print_success "Connection successful!"
    else
      print_error "Connection failed. Check your connection string and MongoDB is running."
    fi
  fi
}

validate_uri() {
  print_header "✅ Connection String Validator"
  
  echo ""
  read -p "Enter MongoDB connection string to validate: " uri
  
  echo ""
  if validate_connection_string "$uri"; then
    echo ""
    extract_connection_details "$uri"
  fi
}

test_connection() {
  print_header "🧪 MongoDB Connection Test"
  
  echo ""
  if [ -f "$ENV_FILE" ] && grep -q "MONGODB_URI" "$ENV_FILE"; then
    # Extract URI from .env
    uri=$(grep "^MONGODB_URI=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/"//g' | sed "s/'//g")
    print_info "Using URI from .env file"
  else
    read -p "Enter MongoDB connection string: " uri
  fi
  
  echo ""
  if test_mongodb_connection "$uri"; then
    print_success "MongoDB is accessible and working!"
  else
    print_error "Cannot connect to MongoDB. Check:"
    echo "  • Connection string is correct"
    echo "  • IP whitelist includes your IP"
    echo "  • Credentials are correct"
    echo "  • Network connectivity is working"
  fi
}

show_configuration() {
  print_header "📊 Current MongoDB Configuration"
  
  echo ""
  echo "Development Environment:"
  if [ -f "$ENV_DEV_FILE" ]; then
    echo -e "${GREEN}✓ .env.development exists${NC}"
    if grep -q "MONGODB_URI" "$ENV_DEV_FILE"; then
      uri=$(grep "^MONGODB_URI=" "$ENV_DEV_FILE" | cut -d'=' -f2- | head -1)
      uri_masked=$(echo "$uri" | sed 's/:[^@]*@/:***@/')
      echo "  URI: $uri_masked"
    fi
  else
    echo -e "${YELLOW}✗ .env.development not found${NC}"
  fi
  
  echo ""
  echo "Production Environment:"
  if [ -f "$ENV_PROD_FILE" ]; then
    echo -e "${GREEN}✓ .env.production exists${NC}"
    if grep -q "MONGODB_URI" "$ENV_PROD_FILE"; then
      uri=$(grep "^MONGODB_URI=" "$ENV_PROD_FILE" | cut -d'=' -f2- | head -1)
      uri_masked=$(echo "$uri" | sed 's/:[^@]*@/:***@/')
      echo "  URI: $uri_masked"
    fi
  else
    echo -e "${YELLOW}✗ .env.production not found${NC}"
  fi
  
  echo ""
  echo "Current .env (active):"
  if [ -f "$ENV_FILE" ]; then
    if grep -q "MONGODB_URI" "$ENV_FILE"; then
      uri=$(grep "^MONGODB_URI=" "$ENV_FILE" | cut -d'=' -f2- | head -1)
      uri_masked=$(echo "$uri" | sed 's/:[^@]*@/:***@/')
      echo "  URI: $uri_masked"
    fi
    if grep -q "NODE_ENV" "$ENV_FILE"; then
      env=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2)
      echo "  NODE_ENV: $env"
    fi
  fi
}

show_monitoring_guide() {
  print_header "📈 MongoDB Monitoring & Alerts Setup"
  
  cat << 'EOF'
MongoDB Atlas Alerts are essential for production reliability.

SETTING UP ALERTS IN MONGODB ATLAS
─────────────────────────────────────────────────────────────────

1. Go to MongoDB Atlas Dashboard
2. Alerts → Alert Settings
3. Add your email: your-team@woof-meetup.com

CRITICAL ALERTS TO CREATE:
─────────────────────────────────────────────────────────────────

Alert: Connection Count Exceeded
├─ Trigger: Connections > 80% of max
├─ Threshold: 4 (if max is 5)
├─ Interval: Instant
└─ Action: Page oncall engineer

Alert: Replication Lag Exceeded
├─ Trigger: Replication lag > 10 seconds
├─ Interval: 1 minute
└─ Action: Investigate immediately

Alert: Backup Failed
├─ Trigger: Any backup failure
├─ Interval: Instant
└─ Action: Page oncall engineer

Alert: CPU Usage High
├─ Trigger: CPU > 80%
├─ Interval: 5 minutes
└─ Action: Scale up or investigate

Alert: Disk Space Critical
├─ Trigger: Free disk < 10GB
├─ Interval: 5 minutes
└─ Action: Scale up immediately

Alert: Authentication Failures
├─ Trigger: Failed auth attempts > 10/minute
├─ Interval: 1 minute
└─ Action: Investigate security incident

SETTING UP PAGERDUTY INTEGRATION (Optional)
─────────────────────────────────────────────────────────────────

For critical alerts, integrate with PagerDuty:

1. MongoDB Atlas → Alerts → Integrations
2. Add PagerDuty integration
3. Create escalation policy for MongoDB alerts
4. Test alert firing

MONITORING IN YOUR APPLICATION
─────────────────────────────────────────────────────────────────

Add connection monitoring to your Node.js app:

import { logger } from './utilities/logger.js';

mongoose.connection.on('error', (err) => {
  logger.logError('MongoDB connection error', err);
  // Send alert to monitoring service
  sendAlert('MongoDB connection error', err);
});

mongoose.connection.on('disconnected', () => {
  logger.logWarning('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.logInfo('MongoDB reconnected');
});

METRICS TO MONITOR
─────────────────────────────────────────────────────────────────

Use MongoDB Atlas Metrics:
✓ Operations/sec
✓ Query execution time
✓ Memory usage
✓ Disk I/O
✓ Network bandwidth
✓ Replication lag (if replica set)
✓ Lock percentage

Set up dashboards in:
• MongoDB Atlas Dashboard
• Datadog (if using)
• New Relic (if using)
• CloudWatch (if AWS)

EOF
  
  echo ""
  print_info "For more details, visit MongoDB Atlas documentation:"
  echo "  https://docs.atlas.mongodb.com/monitor/"
}

open_docs() {
  print_header "📖 MongoDB Security Documentation"
  
  docs_file="$PROJECT_ROOT/docs/MONGODB_SECURITY.md"
  
  if [ -f "$docs_file" ]; then
    print_success "Opening: $docs_file"
    
    # Try to open with available editor/viewer
    if command -v less &> /dev/null; then
      less "$docs_file"
    elif command -v more &> /dev/null; then
      more "$docs_file"
    else
      cat "$docs_file" | head -100
      echo ""
      print_info "Full documentation: $docs_file"
    fi
  else
    print_error "Documentation not found: $docs_file"
  fi
}

reset_to_dev() {
  print_header "🔄 Reset to Development Configuration"
  
  echo ""
  print_warning "This will reset MongoDB configuration to development defaults."
  echo ""
  read -p "Continue? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Cancelled"
    return
  fi
  
  # Create development URI (local MongoDB)
  dev_uri="mongodb://localhost:27017/app-data"
  
  echo "MONGODB_URI=$dev_uri" > "$ENV_FILE"
  echo "NODE_ENV=development" >> "$ENV_FILE"
  
  print_success "Reset to development configuration"
  print_info "MongoDB URI: $dev_uri"
  echo ""
  
  read -p "Start MongoDB? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v brew &> /dev/null; then
      brew services start mongodb-community
      print_success "MongoDB started"
    elif command -v mongod &> /dev/null; then
      mongod --config /usr/local/etc/mongod.conf &
      print_success "MongoDB started"
    else
      print_warning "Could not start MongoDB. Please start it manually."
    fi
  fi
}

################################################################################
# Pre-flight Checks
################################################################################

preflight_checks() {
  print_info "Running pre-flight checks..."
  
  # Check if Node.js modules are installed
  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    print_warning "Node.js dependencies not installed"
    echo "  Run: npm install"
  fi
  
  # Check if .env exists
  if [ ! -f "$ENV_FILE" ]; then
    print_warning ".env file not found"
    echo "  Creating default .env"
    echo "MONGODB_URI=mongodb://localhost:27017/app-data" > "$ENV_FILE"
    echo "NODE_ENV=development" >> "$ENV_FILE"
  fi
  
  print_success "Pre-flight checks complete"
  echo ""
}

################################################################################
# Main Entry Point
################################################################################

main() {
  # Parse command line arguments
  case "${1:-}" in
    --help|-h)
      cat << EOF
MongoDB Atlas Security Setup Script

Usage: $0 [OPTION]

Options:
  --help, -h          Show this help message
  --checklist         Show security checklist
  --test-connection   Test MongoDB connection
  --validate-uri      Validate connection string
  --open-docs         Open MongoDB security documentation
  --reset-dev         Reset to development configuration
  
Without options, opens interactive menu.

Examples:
  $0                          # Interactive menu
  $0 --test-connection       # Test MongoDB
  $0 --open-docs            # Open documentation
EOF
      exit 0
      ;;
    --checklist)
      show_security_checklist
      exit 0
      ;;
    --test-connection)
      test_connection
      exit 0
      ;;
    --validate-uri)
      validate_uri
      exit 0
      ;;
    --open-docs)
      open_docs
      exit 0
      ;;
    --reset-dev)
      reset_to_dev
      exit 0
      ;;
    *)
      preflight_checks
      show_main_menu
      ;;
  esac
}

# Run main function
main "$@"
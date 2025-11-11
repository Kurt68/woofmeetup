# 🛠️ Development Scripts

Utility scripts for development, testing, and maintenance organized by feature area.

## 📁 Directory Structure

```
shscripts/
├── auth/              # Authentication & user management
├── stripe/            # Stripe setup & configuration
├── deletion/          # User deletion & admin testing
├── general/           # Service management & utilities
└── test-images/       # Sample images for testing
```

---

## 🔐 auth/

**User authentication, credential management, and browser testing**

See **[auth/README.md](./auth/README.md)** for detailed implementation guide.

### Scripts

| Script                            | Purpose                             |
| --------------------------------- | ----------------------------------- |
| `setup-users.sh`                  | Store credentials in macOS Keychain |
| `signup.sh [1\|2\|3]`             | Create account with full onboarding |
| `login.sh`                        | Interactive login (select user)     |
| `login-all.sh`                    | Login all 3 users at once           |
| `check-auth.sh [1\|2\|3]`         | Check authentication status         |
| `verify-credentials.sh [1\|2\|3]` | Test credentials against API        |
| `show-password.sh [1\|2\|3]`      | Display password from keychain      |

### Quick Start

```bash
# Setup credentials (first time)
./auth/setup-users.sh

# Create user accounts
./auth/signup.sh 1    # Chrome
./auth/signup.sh 2    # Chrome Incognito
./auth/signup.sh 3    # Firefox

# Login existing user
./auth/login.sh
```

---

## 🔷 stripe/

**Stripe CLI setup and webhook configuration**

### Scripts

| Script                  | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `fix-stripe-account.sh` | Complete Stripe setup and service restart |

### What It Does

1. Stops all running processes (server, client, Stripe CLI)
2. Re-authenticates Stripe CLI with correct account
3. Updates webhook secret in `.env`
4. Restarts all services with proper logging

### Usage

```bash
./stripe/fix-stripe-account.sh
```

**When to use:**

- Initial project setup
- After Stripe CLI authentication expires
- When webhook secret needs updating
- When Stripe account mismatch occurs

---

## 🗑️ deletion/

**User deletion testing and admin endpoint security**

### Scripts

| Script                         | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `test-scheduled-deletion.sh`   | Test scheduled deletion job          |
| `test-security.sh`             | Test admin endpoint security         |
| `test-admin-endpoint.js`       | Programmatic admin endpoint testing  |
| `test-deletion-email.js`       | Test account deletion email delivery |
| `test-credits-email.js`        | Test credits purchase email delivery |
| `check-email-config.js`        | Check email configuration and mode   |
| `investigate-email-mystery.js` | Diagnose email delivery issues       |
| `check-mailtrap-forwarding.js` | Check Mailtrap forwarding settings   |

### Usage

```bash
# Test scheduled deletion logic
./deletion/test-scheduled-deletion.sh

# Test admin endpoint security (rate limiting, auth, roles)
./deletion/test-security.sh

# Programmatic testing
node deletion/test-admin-endpoint.js

# Test deletion email for specific user
node deletion/test-deletion-email.js <email>

# Test credits purchase email
node deletion/test-credits-email.js <email> [credits] [newBalance] [amount]

# Check email configuration (Testing vs Sending mode)
node deletion/check-email-config.js

# Investigate why some emails work but others don't
node deletion/investigate-email-mystery.js

# Check Mailtrap forwarding configuration
node deletion/check-mailtrap-forwarding.js
```

**What's tested:**

- Rate limiting (3 requests/hour)
- JWT authentication
- Admin role verification
- Deletion eligibility checks
- Email delivery to Mailtrap
- Logging functionality

**Note:** Emails are sent to Mailtrap in development. Check https://mailtrap.io/inboxes to view sent emails. To enable real email delivery, see **[Email Setup Guide](../docs/EMAIL_SETUP.md)**.

---

## 🔧 general/

**Service management and system utilities**

### Scripts

| Script            | Purpose                        |
| ----------------- | ------------------------------ |
| `check-status.sh` | Check status of all services   |
| `stop-all.sh`     | Stop all development services  |
| `check-user.js`   | Check user details in database |

### Usage

```bash
# Check what's running
./general/check-status.sh

# Stop everything
./general/stop-all.sh

# Check user info
node general/check-user.js
```

**check-status.sh displays:**

- Server status (port 8000)
- Client status (port 5173)
- Stripe CLI status
- Stripe account configuration
- Process IDs (PIDs)

---

## 🖼️ test-images/

**Sample images for testing user profiles and dog photos**

### Structure

```
test-images/
├── profiles/          # Profile photos
│   ├── profile1.jpg
│   ├── profile2.jpg
│   └── profile3.jpg
└── dogs/             # Dog photos
    ├── dog1.jpg
    ├── dog2.jpg
    └── dog3.jpg
```

### Usage

```bash
# Download sample images
cd test-images
./download-sample-images.sh
```

Images are automatically used by `signup.sh` when creating test accounts.

---

## 🚀 Common Workflows

### Initial Setup

```bash
# 1. Setup Stripe and start services
./stripe/fix-stripe-account.sh

# 2. Setup test user credentials
./auth/setup-users.sh

# 3. Download sample images (optional)
cd test-images && ./download-sample-images.sh && cd ..

# 4. Create test users
./auth/signup.sh 1
./auth/signup.sh 2
./auth/signup.sh 3
```

### Daily Development

```bash
# Check if everything is running
./general/check-status.sh

# Login as test user
./auth/login.sh

# Stop everything when done
./general/stop-all.sh
```

### Testing

```bash
# Test authentication
./auth/verify-credentials.sh 1
./auth/check-auth.sh 1

# Test admin features
./deletion/test-security.sh
./deletion/test-scheduled-deletion.sh

# Check user data
node general/check-user.js
```

---

## 📝 Notes

- All shell scripts use absolute paths and can be run from any directory
- Scripts are designed for macOS/Linux environments
- Some scripts require environment variables to be configured
- Log files are created in the project root directory

---

**For more information, see [Development Guide](../docs/DEVELOPMENT.md)**

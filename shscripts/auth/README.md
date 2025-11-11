# 🔐 Authentication Scripts

Complete authentication system with secure credential storage, automatic onboarding, and browser testing.

---

## 🚀 Quick Start

```bash
# 1. Setup credentials (first time only)
./setup-users.sh

# 2. Create account with full onboarding
./signup.sh 1

# 3. Login existing user
./login.sh
```

---

## 📋 Available Scripts

| Script                  | Purpose                             | Usage                               |
| ----------------------- | ----------------------------------- | ----------------------------------- |
| `setup-users.sh`        | Store credentials in macOS Keychain | `./setup-users.sh`                  |
| `signup.sh`             | Create account with full onboarding | `./signup.sh [1\|2\|3]`             |
| `login.sh`              | Interactive login (select user)     | `./login.sh`                        |
| `login-all.sh`          | Login all 3 users at once           | `./login-all.sh`                    |
| `check-auth.sh`         | Check authentication status         | `./check-auth.sh [1\|2\|3]`         |
| `verify-credentials.sh` | Test credentials against API        | `./verify-credentials.sh [1\|2\|3]` |
| `show-password.sh`      | Display password from keychain      | `./show-password.sh [1\|2\|3]`      |
| `quick-login.sh`        | Interactive login helper            | `./quick-login.sh [1\|2\|3]`        |

---

## 🔧 Implementation Details

### Credential Storage

Credentials are stored securely in **macOS Keychain** with the following structure:

- **Service Name:** `woofmeetup-user[1|2|3]`
- **Account:** User's email address
- **Password:** User's password
- **Comment:** Username (stored as blob attribute)

### Browser Isolation

Each user opens in a different browser to avoid session conflicts:

- **User 1:** Chrome (normal mode)
- **User 2:** Chrome (incognito mode)
- **User 3:** Firefox

### Signup Flow

1. Retrieves credentials from Keychain
2. Creates account via API (`POST /api/auth/signup`)
3. Uploads profile and dog images to Cloudinary
4. Completes onboarding with dog profile and preferences
5. Saves session cookies to `/tmp/woofmeetup_cookies_user*.txt`
6. Opens browser to home page
7. Copies password to clipboard

### Login Flow

1. Retrieves credentials from Keychain
2. Performs API login (`POST /api/auth/login`)
3. Saves session cookies
4. Opens browser to home page
5. Copies password to clipboard

---

## 🧪 Testing

### Verify Credentials Work

```bash
./verify-credentials.sh 2
```

**Output:**

- ✅ Credentials are valid
- ❌ Credentials are invalid (wrong password)

### Check Authentication Status

```bash
./check-auth.sh 2
```

**Output:**

- User details if authenticated
- Error message if session expired

### View Stored Password

```bash
./show-password.sh 2
```

---

## 🐛 Troubleshooting

### "Could not find credentials"

**Solution:** Run setup script

```bash
./setup-users.sh
```

### "User already exists"

**Solution:** Use login instead of signup

```bash
./login.sh
```

### "Wrong Credentials" in Browser

**Step 1:** Verify credentials are valid

```bash
./verify-credentials.sh 2
```

**If valid (✅):** Issue is with browser entry

- Copy email exactly as shown
- Paste password with Cmd+V (don't type)
- Make sure you're on the login page

**If invalid (❌):** Password mismatch

```bash
# Delete old keychain entry
security delete-generic-password -s woofmeetup-user2

# Re-run setup
./setup-users.sh
```

### "Server not responding"

**Solution:** Start the server

```bash
cd /Users/kurt/code/woof-meetup
npm run server
```

### Session Expired

**Solution:** Login again

```bash
./login.sh
```

### Browser Opens to Wrong Page

All browsers now open to home page `/` by design. You need to:

1. Click "Login" button on home page
2. Enter email (shown in terminal)
3. Paste password (Cmd+V - already in clipboard)

---

## 🔐 Security Notes

- Passwords are stored in macOS Keychain (encrypted by OS)
- Session cookies are saved to `/tmp/` (cleared on reboot)
- API uses JWT tokens with HTTP-only cookies
- Passwords are never logged or displayed (except with `show-password.sh`)

---

## 📝 File Locations

- **Keychain:** `~/Library/Keychains/login.keychain-db`
- **Session Cookies:** `/tmp/woofmeetup_cookies_user[1|2|3].txt`
- **Test Images:** `../test-images/profiles/` and `../test-images/dogs/`

---

## 🎯 Common Commands

```bash
# Create users
./signup.sh 1              # Create user 1 in Chrome
./signup.sh 2              # Create user 2 in Chrome Incognito
./signup.sh 3              # Create user 3 in Firefox

# Login existing users
./login.sh                 # Interactive selection

# Diagnostic tools
./verify-credentials.sh 2  # Test if credentials work
./show-password.sh 2       # Display password
./check-auth.sh 2          # Check if session is valid

# Batch operations
./login-all.sh             # Login all 3 users at once
```

---

**For general script documentation, see [../README.md](../README.md)**

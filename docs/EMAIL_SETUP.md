# 📧 Email Configuration Guide

## Overview

This application supports two email delivery modes:

1. **Testing Mode** (Mailtrap Sandbox) - Captures emails for testing, doesn't send to real inboxes
2. **Sending Mode** (Mailtrap Sending API) - Sends emails to real inboxes

## Current Setup

### Testing API (Default - Development)

- **Purpose**: Safe email testing without sending to real users
- **Token**: `MAILTRAP_TOKEN` in `.env`
- **View emails**: https://mailtrap.io/inboxes
- **Behavior**: All emails are captured in Mailtrap inbox

### Sending API (Production)

- **Purpose**: Real email delivery to actual user inboxes
- **Token**: `MAILTRAP_SENDING_TOKEN` in `.env`
- **Endpoint**: `https://send.api.mailtrap.io/`
- **Behavior**: Emails are delivered to real email addresses

---

## 🚀 How to Enable Real Email Delivery

### Step 1: Get Your Sending API Token

1. Go to https://mailtrap.io/sending/streams
2. Create a new sending stream (or use existing)
3. Copy your **API Token**
4. (Optional) Verify your domain for better deliverability

### Step 2: Update Environment Variables

Edit `.env` file:

```bash
# Replace with your actual sending token
MAILTRAP_SENDING_TOKEN=your_actual_sending_token_here

# Enable sending mode
USE_MAILTRAP_SENDING=true
```

### Step 3: Restart Your Server

```bash
# Stop server
./shscripts/general/stop-all.sh

# Start server (it will pick up new env variables)
npm run dev
```

### Step 4: Test Email Delivery

```bash
# Test deletion email to your real inbox
node shscripts/deletion/test-deletion-email.js kurt.ah@outlook.com
```

Check your **real inbox** (kurt.ah@outlook.com) - you should receive the email!

---

## 🔄 Switching Between Modes

### Use Testing Mode (Sandbox)

```bash
USE_MAILTRAP_SENDING=false
```

- Emails captured in Mailtrap inbox
- Safe for development/testing
- No emails sent to real users

### Use Sending Mode (Real Delivery)

```bash
USE_MAILTRAP_SENDING=true
```

- Emails sent to real inboxes
- Use for production or testing real delivery
- Requires valid `MAILTRAP_SENDING_TOKEN`

---

## 📋 Email Types Supported

All email types use the same configuration:

| Email Type           | Function                         | Trigger                    |
| -------------------- | -------------------------------- | -------------------------- |
| Verification         | `sendVerificationEmail()`        | User signup                |
| Welcome              | `sendWelcomeEmail()`             | Email verification         |
| Password Reset       | `sendPasswordResetEmail()`       | Forgot password            |
| Reset Success        | `sendResetSuccessEmail()`        | Password changed           |
| Subscription Welcome | `sendSubscriptionWelcomeEmail()` | Stripe payment success     |
| Account Deletion     | `sendAccountDeletionEmail()`     | Account deletion scheduled |

---

## 🐛 Troubleshooting

### Emails Not Arriving in Real Inbox

**Check 1: Verify sending mode is enabled**

```bash
grep USE_MAILTRAP_SENDING .env
# Should show: USE_MAILTRAP_SENDING=true
```

**Check 2: Verify sending token is set**

```bash
grep MAILTRAP_SENDING_TOKEN .env
# Should show your actual token (not "your_sending_api_token_here")
```

**Check 3: Check spam folder**

- Emails from unverified domains may go to spam
- Add `hello@woofmeetup.com` to your contacts

**Check 4: Verify domain (optional but recommended)**

- Go to https://mailtrap.io/sending/domains
- Add and verify `woofmeetup.com`
- Update DNS records as instructed

### Emails Still Going to Mailtrap Inbox

This means you're still in **Testing Mode**:

1. Set `USE_MAILTRAP_SENDING=true` in `.env`
2. Restart your server
3. Test again

### "Invalid Token" Error

Your `MAILTRAP_SENDING_TOKEN` is incorrect:

1. Go to https://mailtrap.io/sending/streams
2. Copy the correct API token
3. Update `.env` file
4. Restart server

---

## 🎯 Recommended Setup

### Development

```bash
USE_MAILTRAP_SENDING=false
```

- Test emails safely without sending to real users
- View all emails in Mailtrap inbox

### Staging/Testing Real Delivery

```bash
USE_MAILTRAP_SENDING=true
```

- Test with your own email addresses
- Verify email templates and delivery

### Production

```bash
NODE_ENV=production
USE_MAILTRAP_SENDING=true
```

- Automatically uses Sending API
- Real email delivery to all users

---

## 📚 Additional Resources

- [Mailtrap Testing API Docs](https://api-docs.mailtrap.io/docs/mailtrap-api-docs/a2041e813d169-sandbox-api)
- [Mailtrap Sending API Docs](https://api-docs.mailtrap.io/docs/mailtrap-api-docs/93dda88d4c68e-email-sending-api-email-api-smtp)
- [Domain Verification Guide](https://help.mailtrap.io/article/69-sending-domain-setup)

---

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep your API tokens secure
- Use Testing API for development
- Use Sending API only when needed
- Verify your domain for better deliverability and reputation

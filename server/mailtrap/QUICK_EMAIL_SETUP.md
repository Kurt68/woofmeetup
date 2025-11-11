# 🚀 Quick Email Setup & Testing Guide

## ✅ Current Status

**All 7 email types are implemented and working:**

1. ✅ Verification Email (with console logging)
2. ✅ Welcome Email
3. ✅ Password Reset Request
4. ✅ Password Reset Success
5. ✅ Subscription Welcome
6. ✅ **Credits Purchase** (NEW!)
7. ✅ Account Deletion

---

## 📧 Email Configuration

### Current Setup (Already Configured)

Your `.env` file is already set up for **real email delivery**:

```bash
# Sending API (Transactional) - sends emails to real inboxes
MAILTRAP_SENDING_TOKEN=93064a97320abb0fc85a0d6740ae06e3
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/

# Set to 'true' to use Sending API (real email delivery)
USE_MAILTRAP_SENDING=true
```

✅ **No changes needed - emails are being sent to real inboxes!**

### Verify Configuration

```bash
node shscripts/deletion/check-email-config.js
```

Should show:

```
📮 Email Mode:
  🚀 SENDING MODE (Real Email Delivery)
  └─ Emails will be sent to real inboxes
```

---

## 🧪 Testing Emails

### Test Individual Email Types

```bash
# Test account deletion email
node shscripts/deletion/test-deletion-email.js your-email@example.com

# Test credits purchase email
node shscripts/deletion/test-credits-email.js your-email@example.com

# Test with custom values
node shscripts/deletion/test-credits-email.js your-email@example.com 100 150 19.99
```

### Test with Real User Actions

1. **Verification Email:**

   - Sign up with a new account
   - Check console for verification token (now logged!)
   - Check email inbox

2. **Credits Purchase Email:**

   - Start server: `npm run dev`
   - Start Stripe CLI: `stripe listen --forward-to localhost:8000/api/webhook/stripe`
   - Go to credits purchase page
   - Use test card: `4242 4242 4242 4242`
   - Complete purchase
   - Check email inbox

3. **Subscription Email:**
   - Same as credits purchase, but subscribe to Premium/VIP plan

---

## 🎨 Email Design

All emails follow consistent design:

| Feature           | Value                    |
| ----------------- | ------------------------ |
| **Header Color**  | Black (#000000)          |
| **Text Color**    | Dark gray (#333)         |
| **Border Accent** | Black                    |
| **Line Height**   | 1.3                      |
| **Footer**        | Company address included |
| **Contact**       | woofmeetup@outlook.com   |

---

## 🔧 Troubleshooting

### Emails Not Arriving?

1. **Check spam folder** - First time emails may go to spam
2. **Verify configuration:**
   ```bash
   node shscripts/deletion/check-email-config.js
   ```
3. **Check server logs** - Look for email sending errors
4. **Test with script:**
   ```bash
   node shscripts/deletion/test-deletion-email.js your-email@example.com
   ```

### Verification Token Not Showing?

The verification token is now logged to console when sent:

```
========================================
📧 VERIFICATION EMAIL SENT
To: user@example.com
Token: abc123def456
========================================
```

### Credits Purchase Email Not Sent?

1. Ensure Stripe webhook is configured
2. Check webhook secret in `.env`
3. Verify webhook is forwarding: `stripe listen --forward-to localhost:8000/api/webhook/stripe`
4. Check server logs for errors

---

## 📁 Key Files

### Email Templates

- **Location:** `server/mailtrap/emailTemplates.js`
- **Templates:** All 7 email HTML templates

### Email Functions

- **Location:** `server/mailtrap/emails.js`
- **Functions:** Send functions for each email type

### Webhook Integration

- **Location:** `server/controllers/webhook.controller.js`
- **Handles:** Stripe webhooks for subscriptions and credits

### Test Scripts

- **Location:** `shscripts/deletion/`
- **Scripts:**
  - `test-deletion-email.js` - Test account deletion email
  - `test-credits-email.js` - Test credits purchase email
  - `check-email-config.js` - Verify email configuration

---

## 🚀 Quick Commands

```bash
# Check email configuration
node shscripts/deletion/check-email-config.js

# Test deletion email
node shscripts/deletion/test-deletion-email.js your-email@example.com

# Test credits email
node shscripts/deletion/test-credits-email.js your-email@example.com

# Start server
npm run dev

# Start Stripe webhook listener
stripe listen --forward-to localhost:8000/api/webhook/stripe

# Stop all processes
./shscripts/general/stop-all.sh
```

---

## 📚 Full Documentation

For detailed implementation guides, see:

- `docs/EMAIL_SETUP.md` - Complete email setup guide
- `shscripts/README.md` - All available scripts

---

## 💡 Understanding Mailtrap

**Mailtrap has TWO separate APIs:**

1. **Testing API (Sandbox)** - Captures emails, doesn't send them

   - Good for development/testing
   - Emails visible in Mailtrap inbox
   - No real email delivery

2. **Sending API (Transactional)** - Sends emails to real inboxes
   - Used in production
   - Real email delivery
   - Currently enabled in your setup

**Your current setup uses Sending API** - all emails go to real inboxes! ✅

---

## ✨ Recent Updates

### Credits Purchase Email (NEW!)

- Automatically sent when users purchase credits
- Shows credits purchased, new balance, and amount paid
- Consistent design with all other emails
- Test script available: `test-credits-email.js`

### Verification Token Logging (NEW!)

- Verification tokens now logged to console
- Helpful for development and debugging
- Easy to copy/paste for testing

---

**🎉 Everything is set up and working! Your users receive professional emails for all actions!**

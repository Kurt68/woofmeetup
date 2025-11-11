# 🛠️ Development Guide

Complete guide for local development and testing.

---

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- Cloudflare Turnstile keys
- Stripe test account with API keys

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment Variables

**Root `.env`:**

```env
# Server
PORT=8000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development

# Client URL (controls payment redirects)
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Mailtrap
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_ENDPOINT=your_mailtrap_endpoint

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (auto-set by fix-stripe-account.sh)
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_VIP_PRICE_ID=price_...

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret
```

**Client `.env`:**

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### 3. Start Development

**Automated (Recommended):**

```bash
./shscripts/stripe/fix-stripe-account.sh
```

**Manual:**

```bash
# Terminal 1: Server
node server/index.js

# Terminal 2: Client
cd client && npm run dev

# Terminal 3: Stripe CLI
stripe login
stripe listen --forward-to localhost:8000/api/payments/webhook
```

---

## 🔧 Development Scripts

```bash
./shscripts/general/check-status.sh           # Check all services
./shscripts/general/stop-all.sh              # Stop all services
./shscripts/stripe/fix-stripe-account.sh    # Fix Stripe and restart
```

---

## 🧪 Testing

### Quick Webhook Test

```bash
stripe trigger checkout.session.completed
```

### Full Payment Flow Test

1. Navigate to http://localhost:5173
2. Go to pricing page
3. Use test card: `4242 4242 4242 4242`
4. Verify credits added

### Test Cards

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

---

## 🏗️ Production Build Testing

To test production build locally:

1. **Update `.env`:**

   ```env
   CLIENT_URL=http://localhost:8000
   ```

2. **Build and start:**

   ```bash
   npm run build
   npm start
   ```

3. **Test at:** http://localhost:8000

4. **Switch back to dev:**
   ```env
   CLIENT_URL=http://localhost:5173
   ```

---

## 🔍 Troubleshooting

### Stripe Webhooks Not Working

```bash
./shscripts/general/check-status.sh
# If accounts don't match:
./shscripts/stripe/fix-stripe-account.sh
```

### Port Already in Use

```bash
lsof -ti:8000 | xargs kill -9  # Server
lsof -ti:5173 | xargs kill -9  # Client
```

### Database Connection Issues

1. Check MongoDB is running
2. Verify `MONGO_URI` in `.env`
3. Check firewall/network settings

### MongoDB Connection String Issues

```bash
# Test your MongoDB connection
./shscripts/mongodb/setup-security.sh --test-connection
```

If connection fails, check:

- IP is whitelisted in MongoDB Atlas
- Credentials are correct in connection string
- Network connectivity (firewall, VPN)
- MongoDB Atlas cluster status

---

## 🔐 MongoDB Security Configuration

**IMPORTANT: Before production deployment, configure MongoDB security:**

### Quick Setup

```bash
# Interactive MongoDB security setup
./shscripts/mongodb/setup-security.sh

# View security checklist
./shscripts/mongodb/setup-security.sh --checklist

# Test connection
./shscripts/mongodb/setup-security.sh --test-connection
```

### Required for Production

✅ **User Authentication**

- Create separate production user
- Strong password (32+ characters)
- Different from development user

✅ **Network IP Whitelist**

- Remove `0.0.0.0/0` from production
- Add only production server IP(s)
- Use `/32` CIDR notation

✅ **Encrypted Connections (TLS)**

- Use `mongodb+srv://` (auto-enables TLS)
- Already configured ✓

✅ **Automated Backups**

- Configure 6-hour backup interval
- 30-90 day retention
- Off-peak backup window

✅ **Encryption at Rest**

- AWS KMS encryption enabled by default
- Optional: Bring Your Own Key (BYOK)

### Full Documentation

See: `docs/MONGODB_SECURITY.md`

---

## 📊 Service Status

### Development Mode

- **Client:** http://localhost:5173 (Vite dev server)
- **Server:** http://localhost:8000 (Express API)
- **Webhook:** http://localhost:8000/api/payments/webhook

### Production Mode

- **App:** http://localhost:8000 (combined)

---

## 🧪 Testing Checklist

Before committing:

- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can send messages
- [ ] Can complete checkout
- [ ] Webhooks are received
- [ ] Credits are added after purchase
- [ ] No console errors

---

## 📝 Important Notes

### Stripe Webhook Secret~

The webhook secret changes every time you restart `stripe listen`. Use `./fix-stripe-account.sh` to auto-update.

### Stripe Account Matching

Your Stripe CLI must be authenticated with the same account as your API keys:

```
sk_test_XXXXXXXXXXXXXXXXX...
           ^^^^^^^^^^^^^^^^^ = acct_XXXXXXXXXXXXXXXXX
```

### CLIENT_URL Configuration

| Environment              | CLIENT_URL             |
| ------------------------ | ---------------------- |
| Development (Vite)       | http://localhost:5173  |
| Production Build (local) | http://localhost:8000  |
| Production (live)        | https://woofmeetup.com |

---

**Happy coding! 🐕**

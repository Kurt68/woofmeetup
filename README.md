# 🐕 Woof Meetup

A social platform for dog owners to connect, chat, and arrange meetups.

## 📚 Documentation

- **[Development Guide](./docs/DEVELOPMENT.md)** - Local development and testing
- **[Production Guide](./docs/PRODUCTION.md)** - Deployment and production setup
- **[Email Setup & Testing](./server/mailtrap/QUICK_EMAIL_SETUP.md)** - Email configuration and testing guide
- **[Admin Deletion Guide](./docs/ADDITIONAL_DOCS/ADMIN_DELETION_GUIDE.md)** - Scheduled deletion system
- **[Things To Do](./docs/THINGS_TO_DO.md)** - Project roadmap and tasks

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. **Configure environment variables:**
   ```bash
   # See docs/DEVELOPMENT.md for complete environment setup
   cp .env.example .env  # If available
   nano .env
   nano client/.env
   ```

3. **Start development:**
   ```bash
   ./shscripts/stripe/fix-stripe-account.sh
   ```

Visit http://localhost:5173 in your browser (Vite dev server runs on this port).

## 🛠️ Development Scripts

See **[shscripts/README.md](./shscripts/README.md)** for complete script documentation organized by feature area:

- **auth/** - User authentication and credential management
- **stripe/** - Stripe setup and configuration
- **deletion/** - User deletion and admin testing
- **general/** - Service management and utilities
- **test-images/** - Sample images for testing

### Quick Reference

```bash
# Authentication
./shscripts/auth/setup-users.sh          # Setup test user credentials
./shscripts/auth/signup.sh 1             # Create user account
./shscripts/auth/login.sh                # Login existing user

# Service Management
./shscripts/general/check-status.sh      # Check all services
./shscripts/general/stop-all.sh          # Stop all services

# Stripe
./shscripts/stripe/fix-stripe-account.sh # Setup Stripe and restart

# Testing
./shscripts/deletion/test-security.sh    # Test admin endpoints
```

## 📦 Tech Stack

### Frontend

- React + Vite
- Zustand (state management)
- Socket.io (real-time messaging)
- Stripe Elements (payments)
- Cloudflare Turnstile (CAPTCHA)

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Stripe API (payments)
- Cloudinary (image uploads)
- Socket.io (WebSocket)

## 🔑 Key Features

- User authentication with email verification
- Real-time messaging
- Credit-based messaging system
- Stripe payment integration
- Image uploads with Cloudinary
- CAPTCHA protection with Turnstile
- Responsive design

## 📝 Environment Variables

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for complete environment setup.

## 🆘 Troubleshooting

Having issues? Check the [troubleshooting section](./docs/DEVELOPMENT.md) in the development guide.

## 📄 License

MIT

---

**Happy coding! 🐕**

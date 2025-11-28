# 📚 Documentation

Complete documentation for the Woof Meetup project.

---

## 📖 Available Guides

### [DEVELOPMENT.md](./DEVELOPMENT.md)

**Complete guide for local development and testing**

Topics covered:

- Prerequisites and setup
- Environment configuration
- Starting development servers
- Development scripts
- Testing workflows
- Troubleshooting common issues
- Service status monitoring

**Start here if:** You're setting up the project for the first time or need to run it locally.

---

### [PRODUCTION.md](./PRODUCTION.md)

**Deployment and production setup guide**

Topics covered:

- Production environment setup
- Deployment procedures
- Environment variables for production
- Security considerations
- Performance optimization
- Monitoring and logging
- Production troubleshooting

**Start here if:** You're deploying to production or managing a live environment.

---

### [ADMIN_DELETION_GUIDE.md](./ADDITIONAL_DOCS/ADMIN_DELETION_GUIDE.md)

**Comprehensive guide for the scheduled deletion system**

Topics covered:

- Quick start for admins
- How scheduled deletion works (automatic & manual)
- Security features (rate limiting, authentication, authorization)
- Using the manual trigger endpoint
- Setting up admin users
- Troubleshooting deletion issues
- Technical implementation details
- Testing workflows
- Production checklist

**Start here if:** You need to manage user deletions or understand the deletion system.

---

### [THINGS_TO_DO.md](./THINGS_TO_DO.md)

**Project roadmap and task tracking**

Topics covered:

- Pending features
- Bug fixes needed
- Improvements planned
- Technical debt
- Future enhancements

**Start here if:** You want to contribute or see what's planned for the project.

---

## 🚀 Quick Start Guide

### For Developers

1. **Read:** [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Run:** `../shscripts/stripe/fix-stripe-account.sh`
3. **Visit:** http://localhost:5173

### For Admins

1. **Read:** [ADMIN_DELETION_GUIDE.md](./ADDITIONAL_DOCS/ADMIN_DELETION_GUIDE.md)
2. **Get credentials:** Contact project owner
3. **Test:** Use the curl commands in the guide

### For DevOps

1. **Read:** [PRODUCTION.md](./PRODUCTION.md)
2. **Configure:** Environment variables
3. **Deploy:** Follow deployment procedures

---

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── DEVELOPMENT.md              # Local development guide
├── PRODUCTION.md               # Production deployment guide
├── THINGS_TO_DO.md             # Project roadmap
├── ADDITIONAL_DOCS/            # Additional documentation
│   ├── ADMIN_DELETION_GUIDE.md # Scheduled deletion system
│   └── ...
└── CSS_IMPROVEMENTS/           # CSS refactoring guides
    └── ...
```

---

## 🔗 Related Resources

### Scripts

See [../shscripts/README.md](../shscripts/README.md) for utility scripts documentation.

### Client Documentation

- [Client README](../client/README.md) - Frontend-specific documentation
- [Sentry Setup](../client/SENTRY_SETUP.md) - Error tracking configuration
- [CSS Variables](../client/src/styles/CSS_VARIABLES_REFERENCE.md) - Design system

### Component Documentation

- [Auth Components](../client/src/components/auth/README.md)
- [Chat Components](../client/src/components/chat/README.md)
- [Dashboard Components](../client/src/components/dashboard/README.md)
- [Onboarding Components](../client/src/components/onboarding/README.md)

---

## 🆘 Getting Help

### Common Issues

**Can't start the server?**  
→ See [DEVELOPMENT.md - Troubleshooting](./DEVELOPMENT.md#-troubleshooting)

**Stripe webhooks not working?**  
→ Run: `../shscripts/stripe/fix-stripe-account.sh`  
→ Check status: `../shscripts/general/check-status.sh`

**Code quality issues before committing?**  
→ Run: `npm run lint:check` and `npm run format:check`  
→ Auto-fix: `npm run lint` and `npm run format`

**E2E tests failing?**  
→ Run: `npm run test:e2e:ui` for interactive debugging  
→ Check: `npm run test:e2e:report` for detailed results

**Need to trigger deletions?**  
→ See [ADMIN_DELETION_GUIDE.md](./ADDITIONAL_DOCS/ADMIN_DELETION_GUIDE.md)

**Deployment issues?**  
→ See [PRODUCTION.md - Troubleshooting](./PRODUCTION.md#-troubleshooting)

---

## 📋 Quick Reference

### Environment Setup

For complete environment variable setup, see:
- **[DEVELOPMENT.md](./DEVELOPMENT.md#2-configure-environment-variables)** - Development variables
- **[PRODUCTION.md](./PRODUCTION.md#-environment-variables)** - Production variables

Key services to configure:
- MongoDB Atlas (database)
- Stripe (payments)
- Cloudinary/AWS S3 (image storage)
- Mailtrap (email service)
- OpenAI API (content moderation)
- Cloudflare Turnstile (CAPTCHA)
- Sentry (error tracking)
- Redis (optional, for distributed rate limiting)

### Code Quality & Standards

- Linting: `npm run lint` & `npm run lint:check`
- Formatting: `npm run format` & `npm run format:check`
- Testing: `npm run test:e2e` (Playwright)
- See [CLAUDE.md](./CLAUDE.md) for full code standards

---

## 📝 Contributing

When adding new documentation:

1. **Place it in the right location:**

   - General docs → `/docs`
   - Scripts → `/shscripts`
   - Client-specific → `/client`
   - Component-specific → `/client/src/components/[component-name]`

2. **Update this README** with a link to your new documentation

3. **Follow the existing format:**

   - Use clear headings
   - Include code examples
   - Add troubleshooting sections
   - Use emojis for visual navigation

4. **Keep it up to date** when code changes

---

## 🐕 Project Links

- **Main README:** [../README.md](../README.md)
- **Scripts:** [../shscripts/](../shscripts/)
- **Client:** [../client/](../client/)
- **Server:** [../server/](../server/)

---

**Happy coding! 🐕**

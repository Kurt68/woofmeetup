# 📋 Project Roadmap & Tasks

Organized list of planned features, improvements, and technical debt for Woof Meetup.

---

## 🎯 Core Features (Post-Production)

### React Forms Integration

- Replace manual form handling with React form library (React Hook Form or Formik)
- Centralize validation logic
- Improve form error handling and UX
- Reduce boilerplate code in onboarding and profile edit

### Group Chat for Subscriptions

- Enable group conversations for premium/VIP users
- Multiple participants in single chat thread
- Group notifications and mentions
- Real-time group message updates

### Email Notifications

- Match notifications (new like received)
- Message read receipts with email
- Weekly activity digest
- Meetup reminder emails

---

## 🏗️ Architecture Improvements

### Code Organization

- Consolidate utility functions into organized modules
- Create shared validators library
- Refactor API service layer for consistency
- Extract common patterns into custom hooks

### Database Optimization

- Index frequently queried fields
- Implement connection pooling strategies
- Archive old messages to improve query performance
- Add caching layer for user profiles

### Testing Coverage

- Increase unit test coverage
- Add integration tests for critical flows
- Performance testing and optimization
- Accessibility testing (already using Axe)

---

## 📱 Platform Expansion

### React Native Mobile App

- Port frontend to React Native
- Push notifications
- Offline functionality
- Native camera/gallery integration

### Progressive Web App (PWA)

- Service worker implementation
- Offline message queueing
- Install prompts
- Background sync for messages

---

## 🎨 User Experience Enhancements

### Profile Improvements

- More dog breed options
- Personality traits selection
- Photo gallery (multiple dog photos)
- Verification badges
- Age/date of birth formatting

### Discovery Features

- Advanced filters (breed, age range, activity level)
- Saved searches and preferences
- Undo functionality for swipes
- Match percentage scoring

### Onboarding

- Interactive tutorial
- Feature discovery walkthrough
- Permission requests optimization
- Terms & conditions versioning

---

## 🔐 Security & Privacy

### Data Protection

- End-to-end message encryption
- GDPR compliance improvements
- Data export functionality
- Right to be forgotten implementation

### Authentication

- Two-factor authentication (2FA)
- Social login (Google, Apple)
- Passkey/WebAuthn support
- Session management improvements

---

## 📊 Analytics & Insights

### Social Media & Referrals

**✅ Completed:**
- Social share buttons (Twitter, Facebook, LinkedIn, WhatsApp)
- Share URL generation with dog profile info
- Referral source tracking during signup (`?referral=userId`)
- Backend storage of referral source in User model
- Admin API endpoint: `GET /api/auth/referral-stats` (requires admin role)
- Referral stats show: top referral sources, conversion rates, signup breakdown

**❌ Remaining:**
- Admin dashboard page to view referral analytics UI
- Referral rewards system (credits/perks for sharing)
- Batch referral report export
- Referral leaderboard (top shared dogs)

### User Analytics

- User engagement metrics
- Match success rate tracking
- Feature usage analytics
- Retention rate monitoring

### Admin Dashboard

- User statistics dashboard
- Moderation queue management
- System health monitoring
- Revenue tracking and reports
- **Referral analytics view** (view referral stats from API)

---

## 🤖 AI & Content Moderation

### Enhanced Content Moderation

- Batch image moderation improvements
- Text-based toxicity detection
- User report workflow
- Appeal process automation

### AI Features

- Match recommendation engine
- Conversation starters suggestion
- Dog breed identification improvements
- Chat message translation

---

## 💳 Payments & Monetization

### Subscription Management

- Tier management in dashboard
- Auto-renewal handling
- Promotional codes/discounts
- Subscription pause/resume

### Payment Options

- Apple Pay integration
- Google Pay integration
- Direct bank transfer (ACH)
- Invoice/billing portal

---

## 🔧 Technical Debt

### Dependencies

- Regular dependency updates
- Security vulnerability patches
- TypeScript migration (select modules)
- ESLint configuration enhancement

### Performance

- Bundle size optimization
- Image optimization pipeline
- Database query optimization
- Caching strategy improvements

### DevOps

- CI/CD pipeline improvements
- Infrastructure as Code (IaC)
- Automated backup testing
- Disaster recovery procedures

---

## 🐛 Known Issues & Fixes

- [ ] Placeholder for known bugs (to be documented as they arise)
- [ ] Consider implementing bug tracking in issue tracker instead of here

---

## 📋 Done (Completed)

### Security & Validation

- ✅ CSRF protection
- ✅ NoSQL injection prevention
- ✅ Rate limiting with Redis
- ✅ Input validation and sanitization
- ✅ Content moderation with OpenAI Vision

### Features Implemented

- ✅ User authentication with email verification
- ✅ Real-time messaging with Socket.io
- ✅ Credit-based messaging system
- ✅ Stripe payment integration
- ✅ Image uploads with CloudFront signed URLs
- ✅ Tinder-style swipe matching
- ✅ Location-based discovery
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Scheduled user deletion system
- ✅ Error tracking with Sentry

### Frontend Modernization

- ✅ CSS nesting implementation
- ✅ Container queries for components
- ✅ Clamp-based fluid sizing
- ✅ Modern CSS without preprocessors
- ✅ Responsive design refactoring

---

## 🔗 Resources

- **Issue Tracking**: Check GitHub Issues for detailed bug reports
- **Development Guide**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Production Guide**: See [PRODUCTION.md](./PRODUCTION.md)
- **Admin Guide**: See [ADMIN_DELETION_GUIDE.md](./ADDITIONAL_DOCS/ADMIN_DELETION_GUIDE.md)

---

1. Fix signup.sh 1 - csfr getting in the way for dev testing.
2. Fix email gray and Test Welcome email

**Last Updated**: November 2025

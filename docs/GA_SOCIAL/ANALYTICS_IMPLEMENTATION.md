# Google Analytics Implementation Guide

## Overview
Complete GA4 integration added to Woof Meetup with tracking for all major user events:
- Authentication (signup, login)
- Dog profile management (create, update)
- Messaging and chat
- Social sharing
- Payment and purchases
- Matches and likes
- Page navigation

## Core Files

### Services
**`client/src/services/analyticsService.js`**
- `initializeGA(measurementId)` - Initializes GA4 script
- `trackEvent(eventName, eventData)` - Generic event tracking
- `trackPageView(path, title)` - Page view tracking
- User-specific tracking functions:
  - `trackSignup(method)` - Track user registration
  - `trackLogin()` - Track user login
  - `trackDogProfileCreated()` - Track profile creation
  - `trackDogProfileUpdated()` - Track profile updates
  - `trackMessageSent(creditsUsed)` - Track messages
  - `trackProfileLike()` - Track incoming likes
  - `trackProfileMatch()` - Track matches
  - `trackPaymentInitiated(amount, plan)` - Track payment start
  - `trackPaymentCompleted(amount, plan)` - Track payment completion
  - `trackShareEvent(platform)` - Track social shares
  - `trackLinkCopyEvent()` - Track link copies
  - `trackChatInitiated(recipientId)` - Track chat starts
  - `trackProfileViewed()` - Track profile views

### Hooks
**`client/src/hooks/useGA.js`**
- React hook exposing all GA tracking functions
- Usage: `const { trackSignup, trackLogin, ... } = useGA()`

### Integration Points

**Authentication** (`client/src/hooks/auth/useAuthModal.js`)
```javascript
if (isSignUp) {
  await signup(email, password, userName)
  trackSignup('email')  // ← GA tracking
  navigate('/verify-email')
} else {
  await login(email, password)
  trackLogin()  // ← GA tracking
  navigate('/dashboard')
}
```

**Onboarding** (`client/src/hooks/onboarding/useOnboarding.js`)
```javascript
if (success) {
  trackDogProfileCreated()  // ← GA tracking
  navigate('/dashboard')
}
```

**Profile Updates** (`client/src/pages/EditDogProfile.jsx`)
```javascript
if (success && response.data?.modifiedCount > 0) {
  trackDogProfileUpdated()  // ← GA tracking
  navigate('/dashboard')
}
```

**Payments** (`client/src/store/usePaymentStore.js`)
```javascript
// Subscription checkout
if (response.data.url) {
  trackPaymentInitiated(0, planType)  // ← GA tracking
  window.location.href = response.data.url
}

// Credits checkout
if (response.data.url) {
  trackPaymentInitiated(0, packageType)  // ← GA tracking
  window.location.href = response.data.url
}
```

**Payment Success** (`client/src/pages/PaymentSuccess.jsx`)
```javascript
if (response.data.user) {
  useAuthStore.setState({ user: response.data.user })
  trackPaymentCompleted(0, 'completed')  // ← GA tracking
}
```

**Messaging** (`client/src/store/useChatStore.js`)
```javascript
set({ messages: [...messages, newMessage] })
trackMessageSent(1)  // ← GA tracking
```

**Dashboard Events** (`client/src/pages/Dashboard.jsx`)
```javascript
const handleNewMatch = () => {
  trackProfileMatch()  // ← GA tracking
  toast.success('You have a new match! 🎉')
}

const handleUserLiked = (data) => {
  trackProfileLike()  // ← GA tracking
  toast.success(`❤️ ${data.fromUserName} likes you!`)
}
```

**Page Tracking** (`client/src/App.jsx`)
```javascript
const LocationTracker = () => {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname, document.title)  // ← GA tracking
  }, [location.pathname])
  return null
}
```

**Social Sharing** (`client/src/components/share/SocialShareButtons.jsx`)
```javascript
if (url) {
  trackShareEvent(platform)  // ← GA tracking
  window.open(url, '_blank', 'width=600,height=400')
}
```

## Configuration

### Environment Variables
Set in `.env.development` and `.env.production`:

```env
# Development
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Production
VITE_GA_MEASUREMENT_ID=G-YYYYYYYYYY
```

### Getting Your Measurement ID
1. Go to https://analytics.google.com/
2. Click **Admin** (bottom left)
3. Under Property, click **Data Streams**
4. Click your website
5. Copy the **Measurement ID** (format: G-XXXXXXXXXX)

## Event Structure

Each tracking event includes:

```javascript
{
  event: 'event_name',
  event_data: {
    specific_param: 'value',
    timestamp: '2025-11-23T18:00:00.000Z'  // Always included
  }
}
```

### Event Types

| Event | Parameters | Location |
|-------|-----------|----------|
| `user_signup` | `method` ('email') | useAuthModal |
| `user_login` | - | useAuthModal |
| `dog_profile_created` | - | useOnboarding |
| `dog_profile_updated` | - | EditDogProfile |
| `message_sent` | `credits_used` | useChatStore |
| `profile_liked` | - | Dashboard |
| `profile_matched` | - | Dashboard |
| `payment_initiated` | `value`, `plan` | usePaymentStore |
| `payment_completed` | `value`, `plan` | PaymentSuccess |
| `share_initiated` | `platform` (twitter/facebook/linkedin/whatsapp) | SocialShareButtons |
| `link_copied` | - | SocialShareButtons |
| page_view (config) | `page_path`, `page_title` | App (LocationTracker) |

## Testing

### E2E Tests
Two test suites verify GA4 integration:

**`tests/e2e/analytics-ga-integration.spec.ts`** (80 tests)
- GA script loading
- gtag initialization
- dataLayer configuration
- Event tracking for all share buttons
- Copy link event tracking
- Error handling

**`tests/e2e/analytics-user-events.spec.ts`** (55 tests)
- Authentication event infrastructure
- Payment event tracking
- Message event tracking
- Profile event tracking
- Analytics functionality

Run tests:
```bash
npm run test:e2e -- tests/e2e/analytics-ga-integration.spec.ts
npm run test:e2e -- tests/e2e/analytics-user-events.spec.ts
```

## Google Analytics Dashboard Access

After events are tracked, view in Google Analytics:

1. **Realtime Report**: https://analytics.google.com/ → Realtime
2. **Engagement Report**: Events → Engagement
3. **Conversion Funnels**: Setup custom funnels for:
   - Signup → Payment → Message
   - Profile Creation → Match → Chat

## Verify Implementation

In browser console:
```javascript
// Check if GA is loaded
typeof window.gtag === 'function'  // Should be true

// View all tracked events
window.dataLayer  // Should show array of events

// Manually test tracking
window.gtag('event', 'test_event', { test: true })
```

## Future Enhancements

- Add user ID tracking for cross-device analysis
- Implement event conversions (e.g., Signup → Payment)
- Set up revenue tracking for payments
- Add custom user properties (subscription tier, location)
- Implement cohort analysis for user retention
- Add exception tracking for errors
- Set up automated alerts for anomalies

## Troubleshooting

**GA script not loading?**
- Verify `VITE_GA_MEASUREMENT_ID` is set in .env file
- Check browser console for errors
- Ensure measurement ID format is `G-XXXXXXXXXX`

**Events not appearing in GA?**
- Wait 24-48 hours for initial data to appear
- Check Realtime report first (updates within seconds)
- Verify events are firing in console: `window.dataLayer`

**Missing events?**
- Ensure component imports useGA hook
- Check that tracking function is called at right time
- Verify no JavaScript errors in console

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari (with some minor tracking delays)
- ✅ Mobile Chrome
- ✅ Mobile Safari

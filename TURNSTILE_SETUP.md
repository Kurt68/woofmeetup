# Cloudflare Turnstile Setup Guide

This guide explains how to set up Cloudflare Turnstile to replace the custom CAPTCHA system.

## What Was Changed

### Server-side Changes (`/server/index.js`)

- ✅ Commented out all custom CAPTCHA logic
- ✅ Added new `/verify-turnstile` endpoint for server-side verification
- ✅ Added `TURNSTILE_SECRET_KEY` environment variable

### Client-side Changes (`/client/src/components/AuthModal.jsx`)

- ✅ Commented out custom CAPTCHA state and functions
- ✅ Added Cloudflare Turnstile integration
- ✅ Created reusable `TurnstileWidget` component
- ✅ Added `VITE_TURNSTILE_SITE_KEY` environment variable

### New Files Created

- ✅ `/client/src/components/TurnstileWidget.jsx` - Reusable Turnstile component
- ✅ `/client/.env` - Client-side environment variables

## Setup Instructions

### 1. Get Cloudflare Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to "Turnstile" in the sidebar
3. Create a new site
4. Get your **Site Key** (public) and **Secret Key** (private)

### 2. Update Environment Variables

#### Server Environment (`.env`)

```bash
# Cloudflare Turnstile Configuration
TURNSTILE_SECRET_KEY=your_secret_key_here
```

#### Client Environment (`/client/.env`)

```bash
# Cloudflare Turnstile Site Key (Public)
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

### 3. Test the Implementation

1. Start your development server
2. Open the authentication modal
3. You should see the Cloudflare Turnstile widget instead of the math CAPTCHA
4. Complete the verification to proceed to the signup form

## Key Features

- **Automatic Loading**: The Turnstile script loads automatically when needed
- **Server Verification**: Tokens are verified server-side for security
- **Error Handling**: Proper error handling for failed verifications
- **Clean Cleanup**: Widgets are properly cleaned up on component unmount
- **Reusable Component**: The `TurnstileWidget` can be used in other parts of the app

## Troubleshooting

### Widget Not Loading

- Check that your site key is correct in `/client/.env`
- Ensure the domain matches what you configured in Cloudflare
- Check browser console for any script loading errors

### Verification Failing

- Verify your secret key is correct in `.env`
- Check server logs for verification errors
- Ensure your server can reach Cloudflare's verification endpoint

### Development vs Production

- Make sure to use different site keys for development and production
- Update environment variables accordingly for each environment

## Implementation Notes

The custom CAPTCHA system has been completely removed from the codebase. Cloudflare Turnstile is now the only verification method implemented.

## Security Notes

- The site key is public and safe to expose in client-side code
- The secret key must be kept private and only used server-side
- Turnstile tokens are single-use and expire after a short time
- Server-side verification is required for security

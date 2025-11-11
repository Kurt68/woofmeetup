# OpenAI Vision API Setup for Nudity Detection

## Overview

The app now uses **OpenAI's Vision API** for content moderation instead of local TensorFlow models. This is:

- ✅ Faster (no heavy model downloads)
- ✅ More accurate (powered by GPT-4 Vision)
- ✅ Easier to maintain (API updates automatic)
- ✅ Family-friendly strict checks (30% confidence threshold)

## Setup Steps

### 1. Get an OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk_`)

### 2. Add Key to .env

Open `.env` in your repo root and fill in the key:

```env
OPENAI_API_KEY=sk_your_actual_key_here
```

**Save the file.**

### 3. Test the Integration (Optional)

Run the test script to verify everything works:

```bash
node test-openai-detection.js
```

You should see:

```
✓ OpenAI API key found
✓ Initialized successfully
✓ Analysis completed
```

## How It Works

### Image Upload Flow

1. User uploads a profile photo
2. Before processing → **OpenAI Vision API analyzes** the image
3. If nudity detected → **Reject** with message: "Profile photo rejected: This app is family-oriented..."
4. If clean → **Upload to S3** as usual

### Detection Response

```javascript
{
  isNude: boolean,           // Inappropriate content detected?
  confidence: 0.0 - 1.0,    // How sure (higher = more confident)
  reason: "string",          // Explanation from OpenAI
  classifications: {...}     // Legacy format support
}
```

## Cost

OpenAI Vision API usage is **charged per image**:

- ~$0.01 per image (for standard vision requests)
- First profile upload per user = 1 charge
- Edit profile photo = 1 charge per edit

**Estimate**: ~100 users with profile pics = ~$1

Monitor usage at: [platform.openai.com/account/billing](https://platform.openai.com/account/billing)

## Common Issues

### "OPENAI_API_KEY not found"

- Make sure you added the key to `.env`
- Restart the server (`npm run server`)

### "API rate limit exceeded"

- You've hit OpenAI's rate limits
- Wait a few moments and try again
- Contact OpenAI if it persists

### "Invalid API key"

- Double-check the key in `.env` (starts with `sk_`)
- Make sure there are no extra spaces

## Testing in Development

With `NODE_ENV=development`, the server will:

1. Print detailed analysis logs
2. Show confidence scores
3. Allow graceful fallback if API is unavailable

Check server logs for the message:

```
Analyzing image for inappropriate content...
OpenAI response: { isInappropriate: false, confidence: 0.02, reason: "..." }
✓ Image is appropriate for the app
```

## Production Deployment

When deploying to production:

1. Set `OPENAI_API_KEY` environment variable on your hosting platform
2. The nudity detection will work exactly the same
3. All API calls go directly to OpenAI (no local models needed)

## Fallback Behavior

If OpenAI is unavailable:

- ✅ Uploads **still work** (graceful degradation)
- ⚠️ Moderation is skipped with warning in logs
- This prevents outages due to API issues

## Need Help?

- OpenAI Docs: https://platform.openai.com/docs/guides/vision
- API Keys: https://platform.openai.com/api-keys
- Account: https://platform.openai.com/account

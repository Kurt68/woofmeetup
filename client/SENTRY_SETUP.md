# 🔍 Sentry Error Monitoring Setup

## 📋 **Quick Setup**

### **1. Install Sentry**

```bash
npm install @sentry/browser
```

### **2. Get Your Sentry DSN**

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project for "JavaScript/React"
3. Copy your DSN (looks like: `https://abc123@o123456.ingest.sentry.io/123456`)

### **3. Add Environment Variable**

Create/update `.env.local`:

```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### **4. Deploy to Render**

Add the environment variable in Render dashboard:

- Go to your service settings
- Add `VITE_SENTRY_DSN` with your DSN value

## 🎯 **What You Get**

### **Error Tracking**

- Automatic error capture in production
- Stack traces with source maps
- User context and breadcrumbs

### **Performance Monitoring**

```javascript
// Track TensorFlow operations
logger.performance('tensorflow_model_load', 1247, {
  modelSize: '1.7MB',
  device: 'desktop',
})

// Track user actions
logger.userAction('image_uploaded', {
  fileSize: '2.1MB',
  imageType: 'jpeg',
})
```

### **Smart Filtering**

- Ignores network errors and user cancellations
- Only captures real application errors
- Includes context for debugging

## 🚀 **Usage Examples**

```javascript
import { logger } from './utilities/logger'

// Development: Shows in console
// Production: Sends to Sentry
logger.error('TensorFlow model failed to load', error)

// Track ML performance
logger.performance('image_inference', 89, {
  breed: 'Golden Retriever',
  confidence: 0.94,
})

// Track user interactions
logger.userAction('breed_identified', {
  result: 'Golden Retriever',
  confidence: 94,
})
```

## 💡 **Benefits Over Render Logs**

| Feature                 | Render Logs | Enhanced Logger |
| ----------------------- | ----------- | --------------- |
| Client-side errors      | ❌          | ✅              |
| ML performance tracking | ❌          | ✅              |
| User context            | ❌          | ✅              |
| Error aggregation       | ❌          | ✅              |
| Development debugging   | ❌          | ✅              |
| Source maps             | ❌          | ✅              |

## 🔧 **Optional: Skip Sentry**

If you don't want Sentry, the logger still works perfectly:

- Development: Full console logging
- Production: Console errors only
- No external dependencies loaded

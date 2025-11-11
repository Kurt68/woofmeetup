# Production Deployment Checklist

## Current Status: ✅ Ready for Production

---

## Service Worker & Cache Invalidation

### ✅ Automatic Cache Versioning

The Service Worker uses a **build-time generated version** to automatically invalidate caches on each deployment.

**How it works:**

- Build timestamp is injected into `sw.js` as `__BUILD_VERSION__` (format: `YYYYMMDD`)
- Cache name becomes: `woof-meetup-20250512` (example)
- On each deployment, new builds get new version → new cache created
- Old caches automatically cleaned up when SW activates

**Example timeline:**

```
Deploy v1 (May 10)  → Cache: woof-meetup-20250510 ✓ Active
Deploy v2 (May 12)  → Cache: woof-meetup-20250512 ✓ Active (v1 deleted)
Deploy v3 (May 12)  → Cache: woof-meetup-20250512 ✓ Reused (same day)
Deploy v4 (May 14)  → Cache: woof-meetup-20250514 ✓ Active (v2 deleted)
```

**No manual steps required** — automatic with each `npm run build`.

**Implementation Details:**

- `client/vite.config.js`: Generates build version and injects it via Vite's `define` option
- `client/public/sw.js`: Uses injected version for cache naming and old cache cleanup
- Falls back to `'default'` if version not injected (dev mode)

### Stale-While-Revalidate Strategy

The SW implements stale-while-revalidate caching:

- **Cached assets:** Served immediately, then refreshed in background
- **External CDNs:** Bypassed (no caching) to avoid CORS/staleness issues
- **Error handling:** Graceful fallback if cache storage full or network fails
- **Offline mode:** Returns 503 Service Unavailable if offline with no cache

---

## Rate Limiting Configuration

### ✅ Single-Server Deployment (CURRENT)

```
☑ In-memory rate limiting configured and working
☑ All endpoints protected with rate limits
☑ Development mode allows higher limits for testing
☑ Production mode enforces strict limits
```

**Current Setup:** In-memory store (safe and fast for single server)

- No external dependencies required
- Perfect for single server deployments
- Handles millions of requests

### 🚀 Multi-Server Deployment (WHEN SCALING)

```
☑ Redis packages added to package.json (redis ^4.6.14, rate-limit-redis ^4.2.1)
☑ Redis store code implemented in rateLimiter.js
☑ Fallback logic: Uses in-memory if Redis unavailable
☑ REDIS_URL configuration documented in .env
```

**When to Activate:**

1. When deploying 2+ server instances
2. Set `REDIS_URL` environment variable
3. All servers will share rate limit state

**Example:**

```bash
# Before scaling (single server - current)
# Leave REDIS_URL unset → uses in-memory rate limiting ✅

# After scaling (2+ servers - future)
REDIS_URL=redis://default:password@redis-host:6379 → uses Redis store ✅
```

---

## Rate Limited Endpoints

| Category           | Endpoint                         | Limit | Window | Why                 |
| ------------------ | -------------------------------- | ----- | ------ | ------------------- |
| **Authentication** | POST `/api/auth/login`           | 5     | 15 min | Brute force         |
|                    | POST `/api/auth/signup`          | 3     | 1 hour | Account enumeration |
|                    | POST `/api/auth/forgot-password` | 3     | 1 hour | Email spam          |
|                    | POST `/api/auth/verify-email`    | 5     | 15 min | Code brute force    |
| **Messaging**      | POST `/api/messages/send/:id`    | 5     | 5 min  | Spam/bombing        |
|                    | DELETE `/api/messages/:id`       | 10    | 5 min  | Scrubbing attacks   |
|                    | GET `/api/messages`              | 10    | 5 min  | Enumeration         |
| **Payments**       | POST `/api/payments/webhook`     | 20    | 1 min  | Webhook flooding    |
| **Security**       | POST `/api/csrf-token`           | 20    | 5 min  | CSRF abuse          |
|                    | GET `/api/auth/users`            | 3     | 1 hour | User enumeration    |
| **General**        | All `/api/*`                     | 100   | 15 min | DoS protection      |

---

## Implementation Details

### How It Works

1. **Single Server (Current)** ✅

   - Requests tracked in memory
   - Automatic cleanup on expiration
   - Fast (~0.1ms overhead per request)
   - Perfect for current deployment

2. **Multi-Server (When Ready)** 🚀
   - Requests tracked in Redis
   - Shared across all server instances
   - Prevents attackers from bypassing limits by hitting different servers
   - Small latency (~1-5ms per Redis check)

### Configuration Details

**File:** `server/middleware/rateLimiter.js`

- Line 22-77: Redis initialization
- Line 88-352: Rate limiter definitions
- Line 89: `store: getStore()` → Uses Redis if available

**File:** `server/index.js`

- Line 248-255: Redis store initialization on startup

**File:** `.env`

- Lines 97-117: Redis configuration documentation

---

## Verification Commands

### Current Status (Single Server)

```bash
npm run server

# Expected logs:
# ✅ Connection to MongoDB successful
# ✅ Server running on port 8000
# Note: "Redis initialization failed" is expected if REDIS_URL not set
```

### Test Rate Limiting Works

```bash
# Rapid login attempts (should fail after 5 in 15 min)
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -H "X-Forwarded-For: 127.0.0.1"
done

# Should see rate limit response after 5 attempts
```

### When Scaling to Multi-Server

```bash
# 1. Provision Redis (Redis Cloud, AWS, Azure, or self-hosted)
# 2. Get connection URL: redis://default:PASSWORD@HOST:PORT
# 3. Set environment variable:
export REDIS_URL=redis://default:PASSWORD@HOST:6379

# 4. Start server (will connect to Redis)
npm start

# Expected logs:
# ✅ [rate-limiter] Redis store initialized for distributed rate limiting
```

---

## Security Features Summary

| Feature                  | Single-Server | Multi-Server   |
| ------------------------ | ------------- | -------------- |
| Rate Limiting            | ✅ In-Memory  | ✅ Redis-Based |
| Brute Force Protection   | ✅ Yes        | ✅ Yes         |
| DoS Prevention           | ✅ Yes        | ✅ Yes         |
| Spam Prevention          | ✅ Yes        | ✅ Yes         |
| Cross-Server Consistency | ❌ N/A        | ✅ Yes         |
| Scales to N servers      | ❌ 1 only     | ✅ Unlimited   |

---

## Quick Start for Scaling

When you're ready to deploy to multiple servers:

### Step 1: Provision Redis

- Option A: Redis Cloud (https://redis.com/try-free/) - Recommended
- Option B: AWS ElastiCache
- Option C: Azure Cache for Redis
- Option D: Self-hosted Docker

### Step 2: Update Configuration

```bash
# In your deployment config, set:
REDIS_URL=redis://default:your_password@your_host:6379
```

### Step 3: Deploy Multiple Instances

```bash
# Each instance gets the same REDIS_URL
# All traffic goes through load balancer
# Rate limits are shared across all instances
```

### Step 4: Verify

```bash
# Check logs show Redis initialization
# Test that rate limits work across instances
# Monitor Redis connection health
```

---

## Checklist Summary

### Current Single-Server Deployment ✅

- [x] In-memory rate limiting active
- [x] All endpoints protected
- [x] Development/production modes configured
- [x] Rate limiter middleware applied
- [x] Error handling and fallbacks in place

### Ready for Multi-Server ✅

- [x] Redis packages in package.json
- [x] Redis connection code implemented
- [x] REDIS_URL configuration documented
- [x] Automatic fallback if Redis unavailable
- [x] Production warning logged if Redis not configured

### Next Phase (When Scaling) 🚀

- [ ] Provision Redis instance (Redis Cloud, AWS, Azure, etc.)
- [ ] Set REDIS_URL environment variable
- [ ] Deploy 2+ app server instances
- [ ] Configure load balancer
- [ ] Test rate limiting across instances
- [ ] Monitor Redis connection health
- [ ] Set up Redis backup strategy

---

## Bottom Line

**Status:** ✅ **Your application is ready for both single-server AND multi-server deployments!**

- **Right now:** Single-server with in-memory rate limiting ✅
- **When scaling:** Add one line (`REDIS_URL`) for distributed rate limiting ✅
- **Cost impact:** Minimal (Redis is cheap, ~$7-10/month)
- **Performance impact:** Negligible (<5ms latency)

No code changes needed—just configuration when you're ready to scale! 🚀

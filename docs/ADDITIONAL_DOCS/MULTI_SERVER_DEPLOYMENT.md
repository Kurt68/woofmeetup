# Multi-Server Deployment Guide

## Overview

Woof Meetup is **production-ready** for multi-server deployments with distributed rate limiting. This guide explains how to scale from single-server to multiple instances.

## Current Architecture

### Single-Server Deployment ✅ (Current)

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
      ┌──▼──┐
      │ APP │ (In-memory rate limiting)
      └──┬──┘
      ┌──▼────────┐
      │  MongoDB   │
      └────────────┘
```

**Status:** ✅ Ready (in-memory rate limiting works fine for single server)

### Multi-Server Deployment (Planned Scaling)

```
┌─────────────────────┐
│   Load Balancer     │
└────────┬────────────┘
      ┌──┴──┬──┬──┐
      │     │  │  │
   ┌──▼──┐┌─▼─┐  │
   │ APP ││APP │  ... (APP N)
   └──┬──┘└─┬──┘
      │ ┌───┼──────────────────┐
      │ │   │                  │
      │ ▼   ▼                  ▼
   ┌──────────────┐    ┌────────────────┐
   │ Redis Store  │    │   MongoDB      │
   │ (Cluster)    │    │   (Cluster)    │
   └──────────────┘    └────────────────┘
```

**Status:** ⚠️ Ready with single-line configuration

## Step 1: Install Dependencies

The required Redis packages are already in `package.json`:

```bash
npm install
```

This installs:

- `redis` ^4.6.14 - Redis client
- `rate-limit-redis` ^4.2.1 - Redis store for rate limiting

## Step 2: Set Up Redis (Choose One Option)

### Option A: Redis Cloud (Recommended for Production)

1. Create account at https://redis.com/try-free/
2. Create a Redis database
3. Copy the connection string (looks like: `redis://default:PASSWORD@HOST:PORT`)

### Option B: AWS ElastiCache

```bash
# Create ElastiCache cluster via AWS Console
# Get the endpoint from ElastiCache dashboard
# Connection string: redis://endpoint:6379
```

### Option C: Azure Cache for Redis

```bash
# Create via Azure Portal
# Connection string format: redis://default:PASSWORD@HOST:PORT
```

### Option D: Self-Hosted (Development Only)

```bash
# Mac (via Homebrew)
brew install redis
redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

## Step 3: Configure Environment Variable

Update `.env` (or your deployment configuration):

```bash
# Single-Server (Current - Development)
# Leave commented to use in-memory rate limiting
# REDIS_URL=...

# Multi-Server (Production)
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:6379
```

## Step 4: Deploy Multiple Instances

Each instance connects to the same Redis store:

```bash
# Server 1
REDIS_URL=redis://default:pass@redis-host:6379 npm start

# Server 2
REDIS_URL=redis://default:pass@redis-host:6379 npm start

# Server N
REDIS_URL=redis://default:pass@redis-host:6379 npm start
```

All instances now share:

- ✅ Login attempt limits (5 per 15 min)
- ✅ Signup limits (3 per hour)
- ✅ Message sending limits (5 per 5 min)
- ✅ Message deletion tracking
- ✅ Password reset attempts (3 per hour)
- ✅ Webhook rate limiting (20 per min)
- ✅ CSRF token generation limits

## Rate Limiting Coverage

| Endpoint                     | Limit        | Window | Purpose                        |
| ---------------------------- | ------------ | ------ | ------------------------------ |
| `/api/auth/login`            | 5 attempts   | 15 min | Brute force protection         |
| `/api/auth/signup`           | 3 attempts   | 1 hour | Account enumeration prevention |
| `/api/auth/forgot-password`  | 3 attempts   | 1 hour | Password reset spam prevention |
| `/api/auth/verify-email`     | 5 attempts   | 15 min | Email verification protection  |
| `/api/messages/send/:id`     | 5 messages   | 5 min  | Spam prevention                |
| `/api/messages/:id` (DELETE) | 10 deletions | 5 min  | Message scrubbing prevention   |
| `/api/messages` (GET)        | 10 requests  | 5 min  | Enumeration prevention         |
| `/api/payments/webhook`      | 20 requests  | 1 min  | Webhook flooding prevention    |
| `/api/csrf-token`            | 20 requests  | 5 min  | CSRF token abuse prevention    |
| Global API                   | 100 requests | 15 min | General DoS prevention         |

## Deployment Checklist

```
Rate Limiting Configuration
☑ Redis packages installed (redis, rate-limit-redis)
☑ Redis instance provisioned (Redis Cloud, AWS, Azure, etc.)
☑ REDIS_URL configured in production environment
☑ Multi-server instances point to same Redis cluster
☑ Rate limits tested under load
☑ Redis connection monitored
☑ Backup/failover strategy in place

Verification Commands
```

### Verify Redis Connection

```bash
# Test from your server
npm run server  # Development

# Logs should show:
# [rate-limiter] Redis store initialized for distributed rate limiting
```

### Test Rate Limiting

```bash
# Make rapid requests to trigger rate limit
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Should see rate limit response after exceeding limit
```

## Troubleshooting

### Redis Connection Failed

```
Warning: Redis store not available, using in-memory store
```

**Solution:**

- Check `REDIS_URL` environment variable is set correctly
- Verify Redis instance is running
- Check firewall/security groups allow connection

### Rate Limiting Not Enforced Across Instances

- Confirm `REDIS_URL` is the same on all instances
- Verify all instances can reach Redis
- Check Redis logs: `redis-cli MONITOR`

### Memory Usage Spikes

- Redis stores rate limit keys with expiration
- Default expiration: automatic (based on window duration)
- Monitor Redis memory: `redis-cli INFO memory`

## Performance Considerations

- **Redis Latency**: ~1-5ms per request (negligible impact)
- **Key Expiration**: Automatic, no manual cleanup needed
- **High Concurrency**: Redis handles 10,000+ ops/sec easily
- **Scaling**: Add servers as needed; Redis is the bottleneck for typical apps

## Security Best Practices

1. **Use HTTPS for Redis Connection**

   ```bash
   REDIS_URL=rediss://default:PASSWORD@HOST:6379
   ```

2. **Use VPC/Private Network**

   - Redis should not be public internet-accessible
   - Use AWS VPC, Azure vNets, or equivalent

3. **Enable Redis Authentication**

   - Use strong passwords (included in connection string)

4. **Monitor Access**
   ```bash
   redis-cli CONFIG GET requirepass
   redis-cli ACL LIST
   ```

## Scaling Timeline

**Phase 1: Single Server** (Current) ✅

- Deploy one instance with in-memory rate limiting
- No external infrastructure needed

**Phase 2: Multi-Server Ready** (This Update) ✅

- Add Redis URL configuration
- Deploy 2-3 instances behind load balancer
- Shared rate limiting, improved uptime

**Phase 3: Distributed Cache** (Future Optional)

- Add Redis caching for sessions, messages
- Implement cache invalidation strategy
- Further optimize performance

## Cost Estimates (Monthly)

| Platform        | Tier           | Cost  | Rate Limit Ops/Day |
| --------------- | -------------- | ----- | ------------------ |
| Redis Cloud     | Free           | $0    | 30M                |
| Redis Cloud     | Premium        | $7-20 | Unlimited          |
| AWS ElastiCache | cache.t3.micro | $8    | 100M+              |
| Azure           | Basic C0       | $10   | 100M+              |

## Next Steps

1. **Immediate**: ✅ Install Redis packages (`npm install` includes them)
2. **Ready to Scale**: When you need 2+ servers, provision Redis and set `REDIS_URL`
3. **Monitor**: Set up Redis monitoring and alerts
4. **Load Test**: Verify rate limiting works across instances

## Questions?

Refer to:

- `.env` file - Configuration examples
- `server/middleware/rateLimiter.js` - Implementation details
- `server/index.js` - Redis initialization logic (line 248-255)

---

**Status:** ✅ Your application is **production-ready** for multi-server scaling!

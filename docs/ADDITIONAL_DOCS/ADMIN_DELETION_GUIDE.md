# 🔒 Admin Deletion Guide - Complete Reference

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [How It Works](#how-it-works)
3. [Security Features](#security-features)
4. [Using the Manual Trigger](#using-the-manual-trigger)
5. [Setting Up Admin Users](#setting-up-admin-users)
6. [Troubleshooting](#troubleshooting)
7. [Technical Details](#technical-details)

---

## Quick Start

### For Admins: Trigger Manual Deletion

```bash
# 1. Log in and save your authentication cookie
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@example.com","password":"your-password"}' \
  -c cookies.txt

# 2. Trigger the deletion job using your saved cookie
curl -X POST http://localhost:8000/api/auth/trigger-scheduled-deletion \
  -b cookies.txt
```

**Note:** Rate limited to 3 requests per hour. If you get a 429 error, wait 1 hour.

---

## How It Works

### Two Deletion Systems

Your app has **two separate but related systems** for deleting users:

#### 1. Automatic System (2:00 AM Daily)

- **Runs:** Every day at 2:00 AM automatically
- **Auth:** None required (internal server process)
- **Purpose:** Regular cleanup of scheduled deletions
- **Who can use:** N/A - runs automatically

#### 2. Manual Trigger (Admin Endpoint)

- **Runs:** When an admin manually triggers it
- **Auth:** JWT token + Admin role required
- **Purpose:** Testing or emergency deletions
- **Who can use:** Only users with `isAdmin: true`

**Both systems run the SAME deletion logic** - they just have different triggers.

### What Gets Deleted

When either system runs, it:

1. **Finds users** where:

   - `pendingDeletion: true`
   - `scheduledDeletionDate <= now`

2. **Deletes for each user:**
   - User's images from AWS S3
   - User's messages from database
   - User from other users' matches
   - User account from MongoDB
   - Updates deletion logs

### When Users Get Scheduled for Deletion

Users are scheduled for deletion when they request account deletion:

- **No subscription, no purchased credits:** Deleted immediately
- **Has purchased credits:** Scheduled 30 days from now
- **Has active subscription:** Scheduled for subscription end date

**Important:** The `isAdmin` field does NOT protect users from deletion. If an admin requests deletion, they will be deleted like any other user.

---

## Security Features

The manual trigger endpoint (`/api/auth/trigger-scheduled-deletion`) is protected with three security layers:

### Layer 1: Rate Limiting

- **Limit:** 3 requests per hour per IP address
- **Purpose:** Prevents abuse and accidental multiple triggers
- **Response:** 429 Too Many Requests

### Layer 2: Authentication

- **Requirement:** Valid JWT token (from login)
- **Purpose:** Ensures user is logged in
- **Response:** 401 Unauthorized

### Layer 3: Authorization

- **Requirement:** User must have `isAdmin: true` in database
- **Purpose:** Restricts access to admin users only
- **Response:** 403 Forbidden

---

## Using the Manual Trigger

### Prerequisites

1. ✅ You must have an admin account (`isAdmin: true`)
2. ✅ You must be logged in (have a valid JWT token)
3. ✅ You must not exceed the rate limit (3 requests/hour)

### Method 1: Using cURL (Recommended)

```bash
# Step 1: Log in and save cookie
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  -c cookies.txt

# Step 2: Trigger deletion with saved cookie
curl -X POST http://localhost:8000/api/auth/trigger-scheduled-deletion \
  -b cookies.txt
```

### Method 2: Using Browser Console

1. Log in to your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this code:

```javascript
fetch('/api/auth/trigger-scheduled-deletion', {
  method: 'POST',
  credentials: 'include', // Sends your login cookie automatically
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
```

### Method 3: Using Postman

1. Create a new POST request
2. URL: `http://localhost:8000/api/auth/trigger-scheduled-deletion`
3. Go to "Cookies" and add your JWT token
4. Send the request

### Response Codes

| Code | Meaning      | What to Do                      |
| ---- | ------------ | ------------------------------- |
| 200  | Success      | Deletion job executed           |
| 401  | Unauthorized | Log in to get JWT token         |
| 403  | Forbidden    | Set `isAdmin: true` in database |
| 429  | Rate Limited | Wait 1 hour or use different IP |
| 500  | Server Error | Check server logs               |

---

## Setting Up Admin Users

### Make a User an Admin

```bash
# Connect to MongoDB and set user as admin
mongosh "YOUR_MONGODB_URI" --eval '
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {isAdmin: true}}
)'
```

### Verify Admin Status

```bash
# Check if user is admin
mongosh "YOUR_MONGODB_URI" --eval '
db.users.findOne(
  {email: "admin@example.com"},
  {email: 1, isAdmin: 1, _id: 0}
)'
```

Expected output:

```json
{ "email": "admin@example.com", "isAdmin": true }
```

### Remove Admin Status

```bash
# Remove admin privileges
mongosh "YOUR_MONGODB_URI" --eval '
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {isAdmin: false}}
)'
```

---

## Troubleshooting

### Error: 401 Unauthorized

**Cause:** Not logged in or token expired

**Solutions:**

1. Log in again to get a fresh token
2. Verify token exists in browser cookies (F12 → Application → Cookies)
3. Check token hasn't expired (tokens last 7 days)

### Error: 403 Forbidden

**Cause:** User is not an admin

**Solution:**

```bash
# Set user as admin in database
mongosh "YOUR_MONGODB_URI" --eval '
db.users.updateOne(
  {email: "your-email@example.com"},
  {$set: {isAdmin: true}}
)'
```

### Error: 429 Too Many Requests

**Cause:** Rate limit exceeded (3 requests per hour)

**Solutions:**

- Wait 1 hour before trying again
- Use a different IP address
- This is a security feature to prevent abuse

### Error: 500 Internal Server Error

**Cause:** Server error during execution

**Solutions:**

1. Check server logs for detailed error messages
2. Verify AWS credentials are configured
3. Verify MongoDB connection is active
4. Ensure all environment variables are set

### No Users Were Deleted

**Cause:** No users meet the deletion criteria

**Check:**

1. Users must have `pendingDeletion: true`
2. Users must have `scheduledDeletionDate <= now`

```bash
# Check for users ready for deletion
mongosh "YOUR_MONGODB_URI" --eval '
db.users.find({
  pendingDeletion: true,
  scheduledDeletionDate: { $lte: new Date() }
})'
```

---

## Technical Details

### Authentication Flow

```
1. You Log In
   ↓
   Server creates JWT token containing your userId
   ↓
   Server sends token as HTTP-only cookie
   ↓
   Browser stores cookie automatically

2. You Call Admin Endpoint
   ↓
   Browser automatically sends cookie with request
   ↓
   verifyToken middleware validates JWT
   ↓
   checkAdminRole middleware checks database for isAdmin: true
   ↓
   If both pass, deletion job runs
```

### Important Concepts

#### One Token for Everything

- You get ONE JWT token when you log in
- This same token is used for ALL authenticated requests
- There is NO separate "admin token"
- Your admin status is stored in the database, not the token

#### Token Contains Your Identity

```javascript
// Your JWT token contains:
{
  userId: "user_abc123",  // WHO you are
  _id: "507f..."          // Your MongoDB ID
}

// Your database record contains:
{
  user_id: "user_abc123",
  email: "admin@example.com",
  isAdmin: true           // WHAT you can do
}
```

#### Two-Step Verification

1. **Authentication (verifyToken):** "Are you logged in?"

   - Checks if JWT token is valid
   - Extracts your userId

2. **Authorization (checkAdminRole):** "Are you an admin?"
   - Queries database with your userId
   - Checks if `isAdmin === true`

### Middleware Stack

```javascript
router.post(
  '/trigger-scheduled-deletion',
  deletionEndpointLimiter, // Rate limiting: 3 req/hour
  verifyToken, // Authentication
  checkAdminRole, // Authorization
  triggerScheduledDeletionJob
)
```

### Files Involved

**Middleware:**

- `/server/middleware/rateLimiter.js` - Rate limiting
- `/server/middleware/verifyToken.js` - JWT authentication
- `/server/middleware/checkAdminRole.js` - Admin verification

**Controllers:**

- `/server/controllers/auth.controller.js` - Manual trigger endpoint

**Jobs:**

- `/server/jobs/scheduledDeletion.job.js` - Deletion logic

**Routes:**

- `/server/routes/auth.route.js` - Route configuration

**Models:**

- `/server/models/user.model.js` - User schema with `isAdmin` field

### Environment Variables Required

```bash
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-uri
STRIPE_SECRET_KEY=your-stripe-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=your-region
AWS_S3_BUCKET_NAME=your-bucket
```

### Database Queries

**Find users ready for deletion:**

```javascript
db.users.find({
  pendingDeletion: true,
  scheduledDeletionDate: { $lte: new Date() },
})
```

**View deletion logs:**

```javascript
// All deletion logs (most recent first)
db.deletionlogs.find().sort({ createdAt: -1 })

// Completed deletions
db.deletionlogs.find({ deletedAt: { $ne: null } })
```

**Check admin users:**

```javascript
db.users.find({ isAdmin: true }, { email: 1, isAdmin: 1 })
```

---

## Testing Workflow

### 1. Set Up Admin User

```bash
mongosh "YOUR_MONGODB_URI" --eval '
db.users.updateOne(
  {email:"admin@example.com"},
  {$set: {isAdmin: true}}
)'
```

### 2. Create Test User for Deletion

```bash
mongosh "YOUR_MONGODB_URI" --eval '
db.users.updateOne(
  {email:"test-delete@example.com"},
  {$set: {
    pendingDeletion: true,
    scheduledDeletionDate: new Date()
  }}
)'
```

### 3. Trigger Deletion

```bash
# Log in
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt

# Trigger deletion
curl -X POST http://localhost:8000/api/auth/trigger-scheduled-deletion \
  -b cookies.txt
```

### 4. Verify Deletion

```bash
# Should return null if deleted
mongosh "YOUR_MONGODB_URI" --eval '
db.users.findOne({email:"test-delete@example.com"})
'
```

---

## Production Checklist

Before using in production:

- [ ] Test in staging environment first
- [ ] Verify admin users are set correctly
- [ ] Set up monitoring and alerts
- [ ] Document admin users for your team
- [ ] Create backup before running deletions
- [ ] Review server logs after execution
- [ ] Ensure all environment variables are set
- [ ] Test all error scenarios (401, 403, 429)

---

## Best Practices

1. **Always test locally first** - Never test directly in production
2. **Check server logs** - Logs provide detailed execution info
3. **Verify database state** - Check before and after deletion
4. **Backup data** - Consider backing up before bulk deletions
5. **Limit admin access** - Only grant admin privileges to trusted users
6. **Monitor rate limits** - Track 429 responses for potential abuse
7. **Review deletion logs** - Regularly check deletion logs for anomalies

---

## Summary

### Key Points

✅ **Two Systems:** Automatic (2 AM) and Manual (admin trigger)  
✅ **Same Logic:** Both run the same deletion process  
✅ **Three Security Layers:** Rate limiting, authentication, authorization  
✅ **One Token:** Your login token is used for admin actions  
✅ **Database-Based Permissions:** Admin status stored in database, not token  
✅ **Rate Limited:** 3 requests per hour to prevent abuse

### Quick Reference

```bash
# Make user admin
db.users.updateOne({email:"..."}, {$set: {isAdmin: true}})

# Log in and trigger deletion
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' -c cookies.txt
curl -X POST http://localhost:8000/api/auth/trigger-scheduled-deletion -b cookies.txt

# Check deletion logs
db.deletionlogs.find().sort({ createdAt: -1 })
```

---

**⚠️ Warning:** This endpoint permanently deletes user data including Stripe subscriptions, S3 files, and database records. Always verify the operation before executing in production.

**Last Updated:** 2025  
**Status:** 🟢 Production Ready

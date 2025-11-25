# Referral Tracking Implementation

## Overview
Referral tracking enables organic growth by allowing users to share dog profiles via social media and tracking which profiles drive signups.

---

## How It Works

### 1. Social Sharing Flow
**User Action:**
- Dashboard user clicks "Share" on a dog profile → Opens social media share dialog
- Creates post with: dog photo, name, age, meetup type + referral link

**Generated Link:**
```
http://localhost:5173?referral=b8d073ea-e239-423b-a4e5-d84fd9dd4542
```

### 2. Social Media to Homepage
**Non-user on social media:**
- Sees shared post from friend
- Clicks link → Lands on Woof Meetup home page
- URL preserves `?referral=userId` parameter

### 3. Signup with Referral Tracking
**Frontend (Home.jsx → AuthModal → useAuthStore):**
- Extracts `?referral=` from URL using `useSearchParams`
- Passes referral code through signup chain to API
- Includes `referral_source: userId` in POST request

**Backend (auth.controller.js):**
- Accepts `referral_source` in signup request body
- Saves to user document in MongoDB

### 4. User Created with Referral Data
**Database (User model):**
```javascript
{
  _id: ObjectId,
  user_id: "uuid",
  email: "newuser@example.com",
  userName: "new_user",
  referral_source: "b8d073ea-e239-423b-a4e5-d84fd9dd4542", // Dog owner's ID who was shared
  createdAt: ISODate,
  ...
}
```

---

## API Endpoints

### Get Referral Statistics
**Endpoint:** `GET /api/auth/referral-stats`
**Auth:** Admin-only (requires `verifyToken` + `checkAdminRole`)
**Rate Limit:** General limiter (10 requests per minute)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "b8d073ea-e239-423b-a4e5-d84fd9dd4542",
        "count": 5,
        "createdAt": "2025-11-20T10:30:00.000Z"
      },
      {
        "_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "count": 3,
        "createdAt": "2025-11-21T14:15:00.000Z"
      }
    ],
    "summary": {
      "totalSignups": 150,
      "referralSignups": 8,
      "directSignups": 142,
      "referralConversionRate": "5.33"
    }
  }
}
```

**Data Provided:**
- **Top referral sources** - Which dog owners drove the most signups (sorted by count)
- **Total signups** - All signups in system
- **Referral signups** - Signups that came from a referral link
- **Direct signups** - Signups without a referral source
- **Conversion rate** - Percentage of signups from referrals

---

## Files Modified

### Frontend
- **Home.jsx** - Extract `?referral=` from URL, pass to AuthModal
- **AuthModal.jsx** - Accept and pass referral source to useAuthModal
- **useAuthModal.js** - Forward referral source to signup function
- **useAuthStore.js** - Include referral_source in API request

### Backend
- **user.model.js** - Added `referral_source` field to User schema
- **auth.controller.js** - Updated signup endpoint + added getReferralStats endpoint
- **auth.route.js** - Added GET /referral-stats route

---

## Testing the Flow

### 1. Local Testing
```bash
# Start dev server
npm run dev --prefix client
npm run dev --prefix server
```

**Steps:**
1. Login to dashboard
2. Click Share on a profile
3. Copy the URL from browser (has `?referral=`)
4. Logout
5. Open the referral URL
6. Create new account
7. Login as admin → Open DevTools (F12) → Console
8. Check stats:
```javascript
fetch('/api/auth/referral-stats')
  .then(r => r.json())
  .then(console.log)
```

### 2. Admin View Stats
```javascript
// Open browser DevTools (F12) → Console
// Must be logged in as admin
fetch('/api/auth/referral-stats')
  .then(r => r.json())
  .then(console.log)
```

**Output:**
```json
{
  "success": true,
  "data": {
    "stats": [...],
    "summary": {...}
  }
}
```

---

## Future Enhancements

**Phase 2:**
- Admin dashboard UI component to visualize referral stats
- Referral leaderboard (top 10 most-shared dogs)
- Batch export referral data (CSV)

**Phase 3:**
- Referral rewards: Give credits to users who share profiles that convert
- Achievement badges for top referrers
- Email notifications when a share converts to signup

---

## Analytics Data Flow

```
User clicks Share on Profile
    ↓
Social Media Post Created (with ?referral=userId)
    ↓
Friend clicks link from social media
    ↓
Arrives at Home with URL param
    ↓
Signs up with referral_source included
    ↓
New User document saved with referral_source field
    ↓
Admin views /api/auth/referral-stats
    ↓
See which dogs drove signups + conversion metrics
```

---

## Security Notes

- Referral source is optional (nullable field)
- Validated referral IDs are stored (user_id format)
- Stats endpoint is admin-only with rate limiting
- No user privacy impact (only tracks which dog profile was referenced)
- Cannot infer relationships between users from referral field

---

**Last Updated:** November 25, 2025

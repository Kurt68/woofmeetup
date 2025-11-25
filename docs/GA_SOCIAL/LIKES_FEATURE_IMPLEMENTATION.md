# Likes Feature Implementation

## Overview
Implemented a complete likes system with push notifications and email notifications. Users can like profiles from the ProfileModal, and receivers get notified via email and real-time Socket.io events.

## Backend Implementation

### 1. Database Model
**File**: `server/models/like.model.js`
- Schema fields:
  - `fromUserId`: ObjectId reference to User who liked
  - `toUserId`: ObjectId reference to User being liked
  - `read`: Boolean flag for notification status
  - `timestamps`: Automatic createdAt/updatedAt
- Indexes:
  - Unique compound index on `fromUserId` + `toUserId` (prevents duplicate likes)
  - Index on `toUserId` + `read` (for efficient notification queries)

### 2. API Controller
**File**: `server/controllers/like.controller.js`

Endpoints:
- `POST /api/likes/:id` - Create a like for specified user
- `GET /api/likes` - Get all likes received by current user
- `PUT /api/likes/mark-as-read` - Mark all likes as read
- `GET /api/likes/check/:id` - Check if current user has liked someone

Features:
- Validates user IDs to prevent self-liking
- Checks if like already exists (idempotent)
- Sends email notification to receiver
- Emits Socket.io event for real-time notification
- Comprehensive error handling

### 3. API Routes
**File**: `server/routes/like.route.js`
- CSRF protection on POST/PUT operations
- Rate limiting on all operations (30 requests per 5 minutes)
- Token verification required
- Input validation on all parameters

### 4. Email Templates
**File**: `server/mailtrap/emailTemplates.js` (added `LIKE_NOTIFICATION_TEMPLATE`)

Features:
- Pink-themed notification email
- Displays liker's name and dog name
- Shows receiver's dog name
- Call-to-action button to view profile on dashboard
- Professional formatting with logo and branding

### 5. Email Sending
**File**: `server/mailtrap/emails.js` (added `sendLikeNotificationEmail`)

Handles:
- HTML template rendering with proper escaping
- Logo attachment
- Dynamic content substitution
- Non-blocking error handling

### 6. Rate Limiting
**File**: `server/middleware/rateLimiter.js` (added `likeActionLimiter`)

Configuration:
- Default: 30 requests per 5 minutes per IP
- Customizable via environment variables:
  - `LIKE_RATE_LIMIT_MAX` (default: 30)
  - `LIKE_RATE_LIMIT_WINDOW_MS` (default: 300000)

### 7. Server Configuration
**File**: `server/index.js`
- Imported and registered like routes
- Routes available at `/api/likes`

## Frontend Implementation

### 1. Like Hook
**File**: `client/src/hooks/dashboard/useLike.js`

Functions:
- `createLike(toUserId)` - Send like to specified user
- `checkIfLiked(toUserId)` - Check if profile is already liked
- `getLikes()` - Fetch all likes received
- `markLikesAsRead()` - Mark notifications as read
- `setLiked(state)` - Update local like state

State:
- `liked`: Boolean indicating if profile is liked
- `loading`: Boolean for request status

### 2. ProfileModal Component Update
**File**: `client/src/components/dashboard/ProfileModal.jsx`

Changes:
- Imported `Heart` icon from lucide-react
- Integrated `useLike` hook
- Check if profile is already liked on mount
- Added like button in footer
- Dynamic styling based on like state
- Toast notifications on success

### 3. Like Button Styling
**File**: `client/src/styles/components/modals.css`

Styles:
- `.profile-modal-footer` - Added flex layout
- `.profile-modal-like-btn` - Like button styling
  - Base state: Gray border with white background
  - Hover state: Slightly scaled, darker border
  - Liked state: Pink background with pink text and border
  - Disabled state: Reduced opacity while loading
  - Smooth transitions for all state changes

### 4. Socket.io Integration
**File**: `client/src/pages/Dashboard.jsx`

Added:
- `handleUserLiked` function to handle incoming like events
- Socket listener for `userLiked` events
- Toast notification when receiving a like
- Proper cleanup in useEffect return

### 5. Hook Export
**File**: `client/src/hooks/dashboard/index.js`
- Exported `useLike` hook for use in components

## Real-Time Features

### Socket.io Events
- **Event**: `userLiked`
- **Payload**: 
  ```javascript
  {
    fromUserId: ObjectId,
    fromUserName: string,
    fromUserDogName: string,
    timestamp: Date
  }
  ```
- **Trigger**: Emitted when a like is created
- **Receiver**: Target user (via Socket.io)

### Toast Notifications
- User receives toast when profile is liked (real-time via Socket.io)
- User receives toast when clicking like button (success feedback)
- User receives toast on errors

## Error Handling

### Backend
- User not found validation
- Self-like prevention
- Duplicate like handling (returns success without duplicating)
- Input validation and sanitization
- CSRF token validation
- Rate limit enforcement

### Frontend
- Network error handling with toast notifications
- Loading states while requests are in flight
- Graceful degradation if Socket.io events fail
- Email delivery does not block API response

## Security Features

1. **CSRF Protection**: POST/PUT operations require CSRF token
2. **Rate Limiting**: Prevents spam and abuse
3. **Input Validation**: User IDs validated and sanitized
4. **Authentication**: All endpoints require JWT token
5. **Email Security**: Template variables HTML-escaped
6. **Database Unique Constraint**: Prevents duplicate likes at DB level

## Testing Considerations

### Manual Testing
1. Login with user account
2. Navigate to Dashboard
3. Click profile card to open ProfileModal
4. Click "Like" button
5. Verify:
   - Button changes to "Liked" state with pink styling
   - Toast notification appears
   - Email is sent (check Mailtrap)
   - Real-time notification appears if receiver is online

### API Testing
```bash
# Check if user has liked someone
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/likes/check/USER_ID

# Get all likes received
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/likes

# Mark all likes as read
curl -X PUT -H "Authorization: Bearer TOKEN" http://localhost:8000/api/likes/mark-as-read
```

## Environment Variables (Optional)

```bash
# Like rate limiting configuration
LIKE_RATE_LIMIT_MAX=30
LIKE_RATE_LIMIT_WINDOW_MS=300000
```

## Future Enhancements

1. **Web Push Notifications**: Integrate Firebase Cloud Messaging for browser push notifications
2. **Like Counter**: Display number of likes received on dashboard
3. **Liked Profile List**: Show all users who have liked the current user
4. **Like Notifications Tab**: Dedicated tab for like notifications with read/unread status
5. **Like History**: Track and display like activity timeline
6. **Analytics**: Track most-liked profiles and users
7. **Unlike Feature**: Allow users to unlike profiles
8. **Notification Preferences**: Let users customize like notification frequency

## Files Modified/Created

### Created:
- `server/models/like.model.js`
- `server/controllers/like.controller.js`
- `server/routes/like.route.js`
- `client/src/hooks/dashboard/useLike.js`
- `LIKES_FEATURE_IMPLEMENTATION.md` (this file)

### Modified:
- `server/mailtrap/emailTemplates.js` (added template)
- `server/mailtrap/emails.js` (added function)
- `server/middleware/rateLimiter.js` (added limiter)
- `server/index.js` (added routes)
- `client/src/components/dashboard/ProfileModal.jsx` (added like button)
- `client/src/styles/components/modals.css` (added styling)
- `client/src/pages/Dashboard.jsx` (added Socket.io listener)
- `client/src/hooks/dashboard/index.js` (added export)

## Deployment Notes

1. Ensure MongoDB is accessible and Like model will create indexes on first use
2. Mailtrap credentials are already configured
3. Socket.io server automatically handles the userLiked event
4. Rate limiting is production-only by default
5. Build frontend: `npm run build`
6. Start backend: `npm start` (production) or `npm run server` (development)

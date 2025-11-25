# Likes Feature - Quick Start Guide

## How It Works

### User Flow
1. **User A** opens a profile in the ProfileModal
2. **User A** clicks the "❤️ Like" button in the footer
3. **System**:
   - Creates a like record in database
   - Sends email notification to User B
   - Emits real-time Socket.io event to User B (if online)
4. **User B** receives:
   - Email notification with User A's profile info
   - Toast notification (if online)
   - Like appears in their likes list

### API Endpoints

#### Like a Profile
```
POST /api/likes/:userId
Headers: Authorization: Bearer TOKEN, X-CSRF-Token: TOKEN
Response: { success: true, liked: true }
```

#### Get All Likes Received
```
GET /api/likes
Headers: Authorization: Bearer TOKEN
Response: {
  success: true,
  likes: [
    {
      _id: ObjectId,
      fromUserId: { ...userInfo },
      createdAt: Date
    }
  ],
  unreadCount: number
}
```

#### Check If You Liked Someone
```
GET /api/likes/check/:userId
Headers: Authorization: Bearer TOKEN
Response: { success: true, liked: boolean }
```

#### Mark Likes As Read
```
PUT /api/likes/mark-as-read
Headers: Authorization: Bearer TOKEN, X-CSRF-Token: TOKEN
Response: { success: true, message: "Likes marked as read" }
```

## Frontend Integration

### In Components
```jsx
import { useLike } from '../../hooks/dashboard/useLike'

function MyComponent() {
  const { liked, loading, createLike, checkIfLiked } = useLike()
  
  // Check if already liked
  useEffect(() => {
    checkIfLiked(userId)
  }, [userId])
  
  // Create a like
  const handleLike = async () => {
    await createLike(userId)
  }
  
  return (
    <button onClick={handleLike} disabled={loading}>
      {liked ? '❤️ Liked' : '🤍 Like'}
    </button>
  )
}
```

### Socket.io Events
```jsx
const socket = useAuthStore((state) => state.socket)

useEffect(() => {
  if (!socket) return
  
  const handleUserLiked = (data) => {
    console.log(`${data.fromUserName} likes you!`)
  }
  
  socket.on('userLiked', handleUserLiked)
  
  return () => {
    socket.off('userLiked', handleUserLiked)
  }
}, [socket])
```

## Database Schema

### Like Model
```javascript
{
  fromUserId: ObjectId (ref: User),  // User who liked
  toUserId: ObjectId (ref: User),    // User being liked
  read: Boolean,                      // Notification read status
  createdAt: Date,                    // Auto-created
  updatedAt: Date                     // Auto-updated
}

// Unique index: fromUserId + toUserId
// Query index: toUserId + read
```

## Configuration

### Environment Variables (Optional)
```bash
# Rate limiting for like actions
LIKE_RATE_LIMIT_MAX=30                    # Default: 30
LIKE_RATE_LIMIT_WINDOW_MS=300000         # Default: 5 minutes (300000 ms)
```

## Error Handling

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| `"You cannot like your own profile"` | User tried to like themselves | Show message to user |
| `"User not found"` | Invalid user ID | Validate user exists before like button |
| `"Too many like actions"` | Rate limit exceeded | Wait before trying again |
| `"Unauthorized"` | No auth token | User must be logged in |

## Testing with cURL

### 1. Get Auth Token
```bash
# Login first to get token (check cookies)
curl -c cookies.txt http://localhost:8000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Get CSRF Token
```bash
curl -b cookies.txt http://localhost:8000/api/csrf-token
```

### 3. Like a Profile
```bash
curl -b cookies.txt http://localhost:8000/api/likes/USER_ID \
  -X POST \
  -H "X-CSRF-Token: CSRF_TOKEN"
```

### 4. Check Like Status
```bash
curl -b cookies.txt http://localhost:8000/api/likes/check/USER_ID
```

### 5. Get All Likes
```bash
curl -b cookies.txt http://localhost:8000/api/likes
```

## Styling Classes

### Like Button
- `.profile-modal-like-btn` - Main button class
- `.profile-modal-like-btn.liked` - Applied when liked
- `.profile-modal-like-btn:hover` - Hover state
- `.profile-modal-like-btn:disabled` - Loading state

### Colors Used
- Liked: Pink (`#FF1493`, `#FFE5E5`)
- Default: Gray (`--color-gray-light`, `--color-gray-dark`)

## Email Template

Receivers get an email with:
- ❤️ Eye-catching subject: "❤️ {userName} liked your profile on Woof Meetup!"
- Liker's name and dog name
- Receiver's dog name
- Call-to-action button to view profile
- Professional Woof Meetup branding

## Performance Considerations

- Likes are **indexed** for fast queries
- **Unique constraint** prevents duplicate database entries
- **Rate limiting** prevents spam
- **Email sending is non-blocking** (doesn't delay API response)
- **Socket.io is optional** (fallback to email if offline)

## Future Enhancements

- [ ] Unlike functionality
- [ ] Like counter on profile
- [ ] Liked profiles list view
- [ ] Like notifications preferences
- [ ] Web push notifications (Firebase)
- [ ] Like activity timeline
- [ ] Popular profiles based on likes

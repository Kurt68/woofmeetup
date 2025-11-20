# Woof Meetup: Comprehensive Code Audit Report
## Race Conditions, API Handling, Loading States, and Error Boundaries

**Date**: November 20, 2025  
**Scope**: Full-stack React/Node.js application audit

---

## Executive Summary

✅ **GOOD NEWS**: The codebase demonstrates strong defensive practices with **centralized error handling**, **proper async/await patterns**, **memory leak prevention**, and **error boundaries in place**.

⚠️ **ISSUES FOUND**: Several issues present moderate risk, primarily related to **race conditions**, **cleanup gaps**, and **uncontrolled polling**.

---

## 1. RACE CONDITIONS & CONCURRENCY ISSUES

### 🔴 Critical: Uncleared Polling Intervals in `useChatStore.js`

**File**: `client/src/store/useChatStore.js` (line ~150-200)

**Issue**: Polling intervals are created but NOT properly cleaned up on unsubscribe:

```javascript
messageRefreshInterval = setInterval(async () => {
  try {
    await get().getMessages(selectedUser._id)
  } catch (error) {
    console.error('Periodic message refresh failed:', error)
  }
}, 60000)

// Later in unsubscribeFromMessages:
if (messageRefreshInterval) {
  clearInterval(messageRefreshInterval)
  messageRefreshInterval = null
}
```

**Problem**:
- If `setSelectedUser()` is called rapidly, multiple intervals accumulate
- `messageRefreshInterval` is a module-level variable, not a Map or Set
- Only ONE interval is tracked, but MULTIPLE intervals can be created

**Impact**: Memory leak + unnecessary API calls (60s × N intervals)

**Fix Required**: Track intervals per user:
```javascript
const messageRefreshIntervals = new Map()

subscribeToMessages: () => {
  const { selectedUser } = get()
  // Clear existing interval first
  if (messageRefreshIntervals.has(selectedUser._id)) {
    clearInterval(messageRefreshIntervals.get(selectedUser._id))
  }
  
  const interval = setInterval(async () => {
    await get().getMessages(selectedUser._id)
  }, 60000)
  
  messageRefreshIntervals.set(selectedUser._id, interval)
}

unsubscribeFromMessages: () => {
  const { selectedUser } = get()
  if (messageRefreshIntervals.has(selectedUser._id)) {
    clearInterval(messageRefreshIntervals.get(selectedUser._id))
    messageRefreshIntervals.delete(selectedUser._id)
  }
}
```

---

### 🟡 High: Image Polling Race Condition in `useChatStore.js`

**File**: `client/src/store/useChatStore.js` (line ~85-120)

**Issue**: Image polling creates untracked intervals:

```javascript
let pollTimer = setInterval(async () => {
  attempts++
  if (attempts > 30) {
    clearInterval(pollTimer)
    return
  }
  try {
    const { data: messageList } = await axiosInstance.get(...)
    const updated = messageList.find((m) => m._id === newMessage._id)
    if (updated && updated.image) {
      clearInterval(pollTimer)
      // ... update messages
    }
  } catch (e) {
    console.error('Image poll error:', e)
  }
}, 500)
```

**Problem**:
- No global reference to `pollTimer` — if multiple messages send rapidly, timers are orphaned
- If image is never uploaded (error on backend), timer runs full 30 × 500ms = 15 seconds
- No cleanup on unmount or user switch

**Impact**: Zombie polling requests, high memory/CPU usage for fast senders

**Fix Required**: Use AbortController or tracked timer Map:
```javascript
const pollTimers = new Map()

if (messageData.imageBlob && newMessage._id) {
  if (pollTimers.has(newMessage._id)) {
    clearInterval(pollTimers.get(newMessage._id))
  }
  
  let attempts = 0
  const timer = setInterval(async () => {
    attempts++
    if (attempts > 30) {
      clearInterval(timer)
      pollTimers.delete(newMessage._id)
      return
    }
    try {
      // ... poll logic
      if (updated && updated.image) {
        clearInterval(timer)
        pollTimers.delete(newMessage._id)
      }
    } catch (e) {
      if (attempts >= 30) {
        clearInterval(timer)
        pollTimers.delete(newMessage._id)
      }
    }
  }, 500)
  
  pollTimers.set(newMessage._id, timer)
}
```

---

### 🟡 High: Dashboard Socket Listener Duplicates

**File**: `client/src/pages/Dashboard.jsx` (line ~70-100)

**Issue**: Socket listeners attached every time without deduplication:

```javascript
const socket = useAuthStore((state) => state.socket)
useEffect(() => {
  if (!socket) return

  const handleNewMatch = () => { ... }
  const handleUserUnmatched = () => { ... }
  // ... 2 more handlers

  socket.on('newMatch', handleNewMatch)
  socket.on('userUnmatched', handleUserUnmatched)
  socket.on('userAccountDeleted', handleUserAccountDeleted)
  socket.on('userLiked', handleUserLiked)

  return () => {
    socket.off('newMatch', handleNewMatch)
    socket.off('userUnmatched', handleUserUnmatched)
    socket.off('userAccountDeleted', handleUserAccountDeleted)
    socket.off('userLiked', handleUserLiked)
  }
}, [socket, getUser])
```

**Status**: ✅ **Actually SAFE** - cleanup is correct because handlers are recreated in every render

**Note**: This is a common pattern but could be optimized with `useCallback` to prevent function recreation:
```javascript
const handleNewMatch = useCallback(() => { ... }, [getUser])

useEffect(() => {
  if (!socket) return
  socket.on('newMatch', handleNewMatch)
  return () => socket.off('newMatch', handleNewMatch)
}, [socket, handleNewMatch])
```

---

### 🟡 Medium: Concurrent API Calls to `getMessages()`

**File**: `client/src/store/useChatStore.js` (line ~20-35)

**Issue**: No request deduplication:

```javascript
getMessages: async (userId) => {
  set({ isMessagesLoading: true })
  try {
    const res = await axiosInstance.get(`/api/messages/${userId}`)
    set({ messages: res.data })
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to load messages')
    toast.error(msg)
  } finally {
    set({ isMessagesLoading: false })
  }
}
```

**Problem**:
- If called twice rapidly (dashboard + ChatWindow), both requests fire
- Second response wins, potentially overwriting newer state
- No race condition protection

**Impact**: Stale data if responses arrive out-of-order

**Fix Required**: Add abort controller:
```javascript
let messageAbortController = null

getMessages: async (userId) => {
  if (messageAbortController) {
    messageAbortController.abort()
  }
  
  messageAbortController = new AbortController()
  set({ isMessagesLoading: true })
  
  try {
    const res = await axiosInstance.get(
      `/api/messages/${userId}`,
      { signal: messageAbortController.signal }
    )
    set({ messages: res.data })
  } catch (error) {
    if (error.name === 'AbortError') return // Request was cancelled
    const msg = getErrorMessage(error, 'Failed to load messages')
    toast.error(msg)
  } finally {
    set({ isMessagesLoading: false })
  }
}
```

---

## 2. API HANDLING & ERROR HANDLING

### ✅ Excellent: Centralized Axios Instance with Interceptors

**File**: `client/src/config/axiosInstance.js`

**Good Practices**:
- ✅ Request/response logging in dev mode
- ✅ Automatic CSRF token management with refresh retry (max 2 attempts)
- ✅ Custom error properties: `isAuthError`, `isServerError`, `isNetworkError`, etc.
- ✅ 45-second timeout appropriate for image uploads with AI processing
- ✅ Proper FormData handling (Content-Type deleted to let axios set boundary)
- ✅ Clean error tracking with retry count map to prevent infinite loops

**Status**: **SOLID** ✅

---

### 🟡 Medium: Inconsistent Error Handling in Hooks

**File**: `client/src/hooks/dashboard/useDashboardData.js` (line ~40-50)

**Issue**: Silent error handling:

```javascript
const getMeetupTypeUsers = useCallback(
  async (overrideDistance) => {
    try {
      // ...
      setMeetupTypeUsers(response.data)
    } catch (error) {
      console.error('❌ Error fetching meetup type users:', ...)
      // SILENTLY CLEAR - no user feedback
      setMeetupTypeUsers([])
    }
  },
  [userId, selectDistance]
)
```

**Problem**:
- Console error only (won't reach most users)
- No toast or error state for UI
- User sees "no results" instead of "error loading results"
- Difficult to debug in production

**Impact**: User confusion, hidden failures

**Fix Required**: Add error state & toast:
```javascript
const [meetupError, setMeetupError] = useState(null)

const getMeetupTypeUsers = useCallback(async (...) => {
  try {
    // ...
    setMeetupError(null)
  } catch (error) {
    const msg = getErrorMessage(error, 'Failed to load profiles')
    setMeetupError(msg)
    toast.error(msg)
    setMeetupTypeUsers([])
  }
}, [...])

// Return meetupError and display in UI
```

---

### ✅ Good: Error Boundary in Place

**File**: `client/src/components/ui/ErrorBoundary.jsx`

**Good Practices**:
- ✅ Catches render errors and lifecycle errors
- ✅ Logs to Sentry in production
- ✅ Provides fallback UI with "Try Again" button
- ✅ Passes component stack to Sentry for debugging

**Status**: **SOLID** ✅

**Suggestion**: Wrap Dashboard and Chat components with ErrorBoundary:
```jsx
// App.jsx
<ErrorBoundary fallback={<DashboardErrorFallback />}>
  <Dashboard />
</ErrorBoundary>
```

---

### 🟡 Medium: Missing Error Handling for Email/Socket Operations

**File**: `client/src/store/useAuthStore.js` (line ~15-40)

**Issue**: Email operations don't fail gracefully:

```javascript
signup: async (email, password, userName) => {
  set({ isLoading: true, error: null })
  try {
    const response = await axiosInstance.post('/api/auth/signup', {...})
    set({ user: response.data.user, isAuthenticated: true, isLoading: false })
    get().connectSocket() // Can fail silently if socket unavailable
  } catch (error) {
    // Error handling is good here...
  }
}
```

**Problem**:
- `connectSocket()` called without try/catch
- If socket connection fails, signup appears successful but real-time features fail

**Impact**: Broken messaging until page refresh

**Fix Required**:
```javascript
try {
  get().connectSocket()
} catch (err) {
  console.error('Failed to connect socket:', err)
  // Don't block signup, but log the issue
}
```

---

### ✅ Excellent: Backend Error Handling

**File**: `server/middleware/errorHandler.js`

**Good Practices**:
- ✅ Centralized error formatting: `{ success: false, message, error: true }`
- ✅ Sanitized error messages (prevents info disclosure)
- ✅ Detailed server-side logging with `logError`
- ✅ Async error wrapper `handleAsyncError()`
- ✅ Non-blocking email failures (non-critical)

**Status**: **EXCELLENT** ✅

---

### 🟡 Medium: No Retry Logic for Transient Failures

**Issue**: Network timeouts or 5xx errors aren't retried

**Current Behavior**:
```javascript
// axiosInstance response interceptor
async (error) => {
  // Only retries on CSRF (403 + CSRF_TOKEN_INVALID)
  // No retry for: 429, 502, 503, 504
  return Promise.reject(error)
}
```

**Impact**: Real-time messaging fails if server briefly restarts

**Fix Required**: Add exponential backoff:
```javascript
async (error) => {
  const status = error.response?.status
  const shouldRetry = [408, 429, 502, 503, 504].includes(status) 
    && (error.config.__retryCount ?? 0) < 2

  if (shouldRetry) {
    error.config.__retryCount = (error.config.__retryCount ?? 0) + 1
    const delay = Math.pow(2, error.config.__retryCount) * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    return axiosInstance.request(error.config)
  }
  
  // ... existing error handling
}
```

---

## 3. LOADING STATES

### ✅ Good: Consistent `finally` Cleanup

**Files**: Multiple components

**Good Pattern**:
```javascript
const [isLoading, setIsLoading] = useState(false)

const submitProfile = async () => {
  setIsLoading(true)
  try {
    await axiosInstance.post('/api/auth/profile', formData)
  } catch (error) {
    toast.error(msg)
  } finally {
    setIsLoading(true) // ✅ Always runs
  }
}
```

**Status**: **WELL IMPLEMENTED** ✅

---

### 🟡 Medium: Multiple Loading States Not Coordinated

**File**: `client/src/pages/Onboarding.jsx`

**Issue**:
```javascript
const [isLoading, setIsLoading] = useState(false)
const [isDogImageUploading, setIsDogImageUploading] = useState(false)
const [isProfileImageUploading, setIsProfileImageUploading] = useState(false)

const isSubmitDisabled = isLoading || isDogImageUploading || isProfileImageUploading
```

**Problem**:
- No coordinated queue (images can upload simultaneously)
- Button disabled state logic requires prop passing
- Hard to track overall operation status

**Better Pattern**:
```javascript
// Use a single state machine
const [operationStatus, setOperationStatus] = useState('idle') // 'uploading-dog', 'uploading-profile', 'submitting', 'done', 'error'

const isSubmitDisabled = ['uploading-dog', 'uploading-profile', 'submitting'].includes(operationStatus)
```

---

### 🟡 Medium: PaymentSuccess Countdown Can Race

**File**: `client/src/pages/PaymentSuccess.jsx`

**Issue**:
```javascript
useEffect(() => {
  if (isRefreshing) return

  const countdownInterval = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(countdownInterval) // Relies on closure
        navigate('/dashboard', { state: { fromPayment: true } })
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(countdownInterval)
}, [isRefreshing, navigate])
```

**Problem**:
- If `isRefreshing` changes during countdown, new interval created
- Multiple intervals can exist simultaneously
- Cleanup dependency array includes `navigate` (function reference)

**Fix Required**:
```javascript
useEffect(() => {
  if (isRefreshing) return

  const countdownInterval = setInterval(() => {
    setCountdown((prev) => {
      const next = prev - 1
      if (next <= 0) {
        clearInterval(countdownInterval)
        navigate('/dashboard', { state: { fromPayment: true } })
      }
      return next
    })
  }, 1000)

  return () => clearInterval(countdownInterval)
}, [isRefreshing]) // Remove navigate, use navigate from closure
```

---

### 🟡 Medium: ChatWindow `getMessages()` Dependency

**File**: `client/src/components/chat/ChatWindow.jsx`

**Issue**:
```javascript
useEffect(() => {
  getMessages(selectedUser._id)
  subscribeToMessages()

  return () => unsubscribeFromMessages()
}, [getMessages, selectedUser._id, subscribeToMessages, unsubscribeFromMessages])
```

**Problem**:
- `getMessages` is a store function, recreated on every render if not memoized
- Effect runs more often than necessary
- Multiple fetches can fire

**Fix Required**: Memoize store functions or use dependency differently:
```javascript
useEffect(() => {
  const fetchAndSubscribe = async () => {
    await getMessages(selectedUser._id)
    subscribeToMessages()
  }
  
  fetchAndSubscribe()
  
  return () => unsubscribeFromMessages()
}, [selectedUser._id]) // Minimal dependencies
```

---

## 4. ERROR BOUNDARIES & ERROR RECOVERY

### ✅ Good: Onboarding Has Defensive Error Handling

**File**: `client/src/pages/Onboarding.jsx`

**Good Pattern**:
```javascript
let hookData
try {
  hookData = useOnboarding()
} catch (err) {
  console.error('❌ Error in useOnboarding hook:', err)
  setRenderError(`Hook Error: ${err.message}`)
}

if (renderError) {
  return <ErrorDisplay message={renderError} />
}
```

**Status**: **DEFENSIVE** ✅

---

### 🟡 Medium: No Error Recovery for Image Upload Failures

**File**: `client/src/hooks/onboarding/useOnboarding.js`

**Issue**:
```javascript
const handleDogImageUpload = async () => {
  if (!dogImageFile) {
    setDogImageError('Please select an image first')
    throw new Error('No image file selected')
  }

  setIsDogImageUploading(true)
  setDogImageError(null)

  try {
    const response = await axiosInstance.put('/api/auth/image', formData, {
      timeout: 60000,
    })
    if (response.data?.dogBreeds) {
      setDogBreeds(response.data.dogBreeds)
      setIsDogImageUploaded(true)
    } else {
      const errorMsg = 'Could not detect a dog in this image. Please upload a dog photo.'
      setDogImageError(errorMsg)
      // ❌ No retry option offered
      throw new Error(errorMsg)
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message
    setDogImageError(errorMessage)
    setIsDogImageUploaded(false)
    throw new Error(errorMessage)
  } finally {
    setIsDogImageUploading(false)
  }
}
```

**Problem**:
- User must select image again after failure
- No "retry" button
- Throws error which stops form submission

**Better Approach**:
```javascript
// Keep image selected, show error, allow retry without re-selecting
// Don't throw — return { success: false, error }
```

---

### ✅ Excellent: Socket Reconnection Handler

**File**: `client/src/store/useChatStore.js` (line ~135-145)

**Good Pattern**:
```javascript
const handleReconnect = async () => {
  const currentSelectedUser = get().selectedUser
  if (!currentSelectedUser) return
  
  console.log('🔄 Socket reconnected, fetching messages for:', currentSelectedUser._id)
  setTimeout(async () => {
    try {
      await get().getMessages(currentSelectedUser._id)
      console.log('✅ Messages fetched after reconnect')
    } catch (error) {
      console.error('Failed to fetch messages on reconnect:', error)
    }
  }, 300)
}

socket.on('connect', handleReconnect)
```

**Status**: **WELL IMPLEMENTED** ✅

**Note**: The 300ms delay is good for allowing socket state to stabilize.

---

### 🔴 Critical: No Logout on 401 Errors

**Issue**: 401 (Unauthorized) not handled globally

**Current State**: Axios interceptor logs 401 but doesn't clear auth:

```javascript
error.isAuthError = status === 401
// Returns Promise.reject(error) — component must handle
```

**Problem**:
- User session expired but remains logged in UI
- Forms submit but fail
- No automatic logout/redirect to login

**Fix Required**: Add global 401 handler:

```javascript
// In axiosInstance response interceptor
if (status === 401 && !error.config.url.includes('check-auth')) {
  console.warn('🚨 Unauthorized (401) - clearing auth state')
  useAuthStore.setState({ 
    user: null, 
    isAuthenticated: false 
  })
  window.location.href = '/login' // Or use navigate
}
```

---

## 5. SUMMARY TABLE

| Issue | Severity | Location | Status | Impact |
|-------|----------|----------|--------|--------|
| Uncleared polling intervals | 🔴 Critical | `useChatStore.js:150-200` | ❌ Not Fixed | Memory leak, duplicate requests |
| Image polling race condition | 🟡 High | `useChatStore.js:85-120` | ❌ Not Fixed | Zombie timers, wasted resources |
| Silent error handling in dashboard | 🟡 High | `useDashboardData.js:45` | ❌ Not Fixed | Hidden failures, poor UX |
| Concurrent getMessages() | 🟡 Medium | `useChatStore.js:20` | ❌ Not Fixed | Stale data if responses arrive out-of-order |
| No 401 global handler | 🔴 Critical | `axiosInstance.js` | ❌ Not Fixed | Session doesn't expire on UI |
| No retry logic for 5xx/429 | 🟡 Medium | `axiosInstance.js` | ❌ Not Fixed | Poor resilience to transient failures |
| PaymentSuccess race condition | 🟡 Medium | `PaymentSuccess.jsx:45` | ❌ Not Fixed | Multiple countdowns |
| Socket connection error silencing | 🟡 Medium | `useAuthStore.js:35` | ⚠️ Partial | Broken real-time after signup |
| Dependency array triggers extra renders | 🟡 Low | `ChatWindow.jsx:25` | ⚠️ Minor | Extra API calls |
| Image upload no retry option | 🟡 Low | `useOnboarding.js:85` | ⚠️ Minor | Poor UX on transient failures |
| ErrorBoundary not wrapping features | 🟡 Low | `App.jsx` | ⚠️ Minor | Unhandled render errors crash page |

---

## 6. RECOMMENDATIONS (PRIORITY ORDER)

### 🔴 Must Fix (Production Issues)

1. **Add global 401 handler to axiosInstance** (5 min)
   - Auto-logout on session expiration
   - Redirect to login

2. **Fix message polling intervals** (15 min)
   - Use Map to track per-user intervals
   - Clear on unmount and user switch

3. **Add AbortController to concurrent requests** (20 min)
   - Prevent stale data from out-of-order responses
   - Cancel in-flight requests when switching users

### 🟡 Should Fix (Within Sprint)

4. **Add error states to dashboard data hooks** (10 min)
   - Replace silent errors with toast + state
   - Show "Error loading profiles" UI

5. **Fix PaymentSuccess countdown race** (5 min)
   - Simplify dependency array
   - Prevent multiple intervals

6. **Add retry logic for transient failures** (30 min)
   - Exponential backoff for 502/503/504/429
   - Max 2 retries with 1-4 second delays

7. **Wrap feature components with ErrorBoundary** (5 min)
   - Dashboard
   - Chat
   - Payment

8. **Add error handling for socket connect** (5 min)
   - Don't silently fail in signup
   - Retry or show user

### 🟢 Nice to Have (Quality)

9. Memoize store functions with useCallback
10. Add request deduplication middleware
11. Use Zustand middleware for devtools
12. Add custom React Devtools profiler

---

## 7. CONCLUSION

**Overall Grade: B+ (Good with Important Fixes Needed)**

**Strengths**:
- ✅ Centralized, well-designed Axios interceptor
- ✅ Proper error boundary implementation
- ✅ Socket reconnection handling
- ✅ Consistent `finally` cleanup patterns
- ✅ Backend error sanitization

**Weaknesses**:
- ❌ Uncontrolled polling intervals (critical)
- ❌ No global 401 handler (critical)
- ❌ Race conditions in concurrent requests
- ❌ Silent error handling in key areas
- ⚠️ Missing retry logic for resilience

**Estimated Fix Time**: 1.5-2 hours for all critical + high-priority issues


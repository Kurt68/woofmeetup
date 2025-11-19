# Debug Toast Messages Not Showing

## Quick Test Steps

### Step 1: Check Browser Console
1. Open **Tab 1** (User A)
2. Press **F12** → Console tab
3. Open a profile modal and **click Like**
4. Look for logs like:
   - `❤️ [useLike] Creating like for: USER_ID`
   - `✅ [useLike] Like response: { success: true, liked: true }`
5. **Should see "Profile liked!" toast**

### Step 2: Check Server Logs
1. In terminal where server is running, look for:
   ```
   🔍 [like.controller] Looking up socket for toUserId: ...
   ✅ [like.controller] Found socket ..., emitting userLiked event
   ✅ [like.controller] Like email sent to ...
   ```

### Step 3: Check Socket.io Connection
In **Tab 1** console, type:
```javascript
// Get current socket instance
const socket = Object.values(window.__vite_plugin_vue_inspector_links || {})
// Or check in React devtools if socket is connected
```

More directly, look at **Network → WS (WebSocket)** tab:
- Should see `socket.io` connection
- Look for messages (click on the WS entry)

### Step 4: Verify Two Users Are Connected
- **Tab 1**: Open F12 → Network
- **Tab 2**: Open F12 → Network
- Both should have a **green `socket.io`** WebSocket connection
- Check the URL: `ws://localhost:8000/socket.io/?...`

### Step 5: Check Real-Time Socket Event
In **Tab 2** (User B receiving the like):

1. Go to **F12 → Network → WS (WebSocket)**
2. Click the `socket.io` connection
3. Look at **Messages** tab
4. Have **Tab 1** click Like
5. **Tab 2** should show a message like:
   ```
   2["userLiked",{"fromUserId":"...","fromUserName":"marley",...}]
   ```

---

## Common Issues & Fixes

### Issue 1: "Profile liked!" Toast Not Showing (Tab 1)
**Cause**: API request failed or toast component not working

**Debug**:
```bash
# Check browser console in Tab 1
# Look for: ❌ [useLike] Like error: ...
# OR no logs at all (means code isn't running)
```

**Fix**:
1. Check if you're logged in
2. Verify `toast` library is imported
3. Check Network tab for POST `/api/likes/USER_ID` 
   - Should return `201` status
   - Body: `{ "success": true, "liked": true }`

---

### Issue 2: Real-Time Toast Not Showing (Tab 2)
**Cause**: Socket.io event not received or disconnected

**Debug**:
```bash
# In Tab 2 console, check socket connection:
# Look for: ✅ Socket connected: socket_id (transport: websocket)

# Check if userLiked listener is registered:
# It should be in Dashboard.jsx useEffect
```

**Fixes**:
1. **Verify Socket.io is connected**:
   - Check F12 → Network → filter by WS
   - Should see green `socket.io` line
   - If red/closed, Socket.io disconnected

2. **Check if event is being emitted**:
   - Look at server logs for: `✅ Found socket ..., emitting userLiked event`
   - If you see `⚠️ No socket found`, user is offline

3. **Verify Dashboard is open in Tab 2**:
   - The listener is only in Dashboard.jsx
   - Don't have a modal open, stay on dashboard

---

### Issue 3: Server Says "No socket found"
**Cause**: User ID mismatch or connection issue

**Debug in server logs**:
```
⚠️ No socket found for toUserId 691362... (user offline)
🔍 Looking up socket for toUserId: 691362...
❌ User 6913... NOT found (2 total online)
```

**Fix**:
1. **Verify both users are logged in**:
   - Should see two green socket connections in Network
2. **Check Socket.io map**:
   - Server should have both users in memory
   - If only 1 total online, other user isn't connected
3. **Restart both browser tabs**:
   - F5 refresh on both tabs
   - Re-establish socket connections

---

## Step-by-Step Debug Process

### Setup
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
cd client && npm run dev

# Terminal 3: Monitor server logs
tail -f /tmp/server.log | grep -E "like|socket|Looking"
```

### Test Scenario
**Tab 1 (User A - Marley)**:
1. Login as `marley`
2. Open F12 console
3. Stay on Dashboard (don't open modal yet)

**Tab 2 (User B - Kurt)**:
1. Login as `kurt`
2. Open F12 console
3. Stay on Dashboard

**Back to Tab 1**:
1. Open a profile modal
2. In console, you should see: `❤️ [useLike] Creating like for: USERID`
3. Click "Like" button
4. Check console for: `✅ [useLike] Like response: ...`
5. Should see: `Profile liked!` toast

**Watch Tab 2**:
1. Stay on Tab 2 Dashboard
2. Check console for Socket messages
3. Should see toast: `❤️ marley likes you!`
4. Check server logs (Terminal 3)

---

## Expected Logs

### Browser Console (Tab 1 - Liker)
```
❤️ [useLike] Creating like for: 691362a9a571dd6bd094c770
✅ [useLike] Like response: { success: true, liked: true, message: "Like created successfully" }
```

### Browser Console (Tab 2 - Receiver)
```
(No specific console logs, but toast should appear)
```

### Server Logs
```
🔍 [like.controller] Looking up socket for toUserId: 691362a9a571dd6bd094c770
✅ [like.controller] Found socket qWBSuYms..., emitting userLiked event
✅ [like.controller] Like email sent to kurt@example.com
```

### Network Tab (Tab 2)
**WebSocket Messages** should include:
```
2["userLiked",{"fromUserId":"691362a9a571dd6bd094c765","fromUserName":"marley","fromUserDogName":"Buddy","timestamp":"2025-11-18T22:50:00.000Z"}]
```

---

## If Still Not Working

### Check 1: Verify API Call Works
```javascript
// In browser console of Tab 1
fetch('/api/likes/691362a9a571dd6bd094c770', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d))
```

### Check 2: Verify Socket is Listening
```javascript
// In browser console of Tab 2
// This is run automatically in Dashboard.jsx
// Socket should emit 'userLiked' event when like is created
```

### Check 3: Check Firebase/Mailtrap
- Go to **Mailtrap Dashboard**
- Check **Inbox** for like notification email
- If email arrived, backend is working
- If not, check `.env` Mailtrap credentials

### Check 4: Restart Everything
```bash
# Kill both server and client
lsof -ti:8000 | xargs kill -9
lsof -ti:5176 | xargs kill -9

# Clear cache
rm -rf client/dist node_modules/.vite

# Restart
npm run server
npm run dev --prefix client
```

---

## Files with Debug Logging Added
- `server/controllers/like.controller.js` - Added socket lookup logs
- `client/src/hooks/dashboard/useLike.js` - Added create/response logs

Clean these up when done testing by removing `console.log` and `logInfo` calls.

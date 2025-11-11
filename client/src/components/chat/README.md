# Chat Components

## Overview

The Chat components provide a real-time messaging system for matched dog owners to communicate. The system includes match display, conversation management, message threading, and responsive design for both desktop and mobile experiences.

## Component Structure

### Main Components

#### `ChatContainer.jsx` (Main Container)

- **Purpose**: Orchestrates the entire chat experience
- **Responsibilities**:
  - Manages chat state and user selection
  - Coordinates between matches display and active conversations
  - Handles responsive layout (desktop vs mobile)
  - Integrates with header navigation
- **Props**:
  - `user`: Current user profile object
- **Features**:
  - Responsive design with different layouts for mobile/desktop
  - State management for selected conversations
  - Integration with app header

#### `ChatWindow.jsx` (Desktop Chat Interface)

- **Purpose**: Full-featured chat interface for desktop users
- **Responsibilities**:
  - Displays conversation history with message threading
  - Handles real-time message updates via WebSocket
  - Manages message loading states
  - Provides smooth scrolling to new messages
- **Props**:
  - `user`: Current user profile object
- **Features**:
  - Real-time message synchronization
  - Auto-scroll to latest messages
  - Message loading skeletons
  - Image and text message support
  - Timestamp formatting

#### `ChatModal.jsx` (Mobile Chat Interface)

- **Purpose**: Modal-based chat interface optimized for mobile
- **Responsibilities**:
  - Provides full-screen chat experience on mobile
  - Handles modal open/close states
  - Optimized touch interactions
- **Props**:
  - `user`: Current user profile object
- **Features**:
  - Full-screen mobile experience
  - Touch-optimized interface
  - Modal state management

#### `ChatSidebar.jsx` (Conversation List)

- **Purpose**: Displays list of active conversations
- **Responsibilities**:
  - Shows all matched users available for chat
  - Handles conversation selection
  - Displays conversation previews
- **Props**:
  - `clickedUser`: Currently selected user for chat
- **Features**:
  - Conversation list management
  - User selection handling
  - Match status display

#### `MatchesDisplay.jsx` (Match Gallery)

- **Purpose**: Shows all matched users in a grid layout
- **Responsibilities**:
  - Displays matched user profiles
  - Handles match selection for starting conversations
  - Provides visual match overview
- **Props**:
  - `matches`: Array of matched user objects
  - `setClickedUser`: Function to select a user for chat
- **Features**:
  - Grid-based match display
  - Click-to-chat functionality
  - Match status indicators

#### `ChatHeader.jsx` (Chat Header)

- **Purpose**: Displays chat header with user information
- **Responsibilities**:
  - Shows selected user's profile information
  - Provides chat controls and navigation
  - Displays online/offline status
- **Features**:
  - User profile display
  - Chat navigation controls
  - Status indicators

#### `MessageInput.jsx` (Message Composition)

- **Purpose**: Handles message input and sending
- **Responsibilities**:
  - Text message composition
  - Image attachment handling
  - Message validation and sending
  - Input state management
- **Features**:
  - Text and image message support
  - Real-time input validation
  - Send button state management
  - File upload integration

## Supporting Store

### `useChatStore.js` (Zustand Store)

- **Purpose**: Centralized chat state management
- **Responsibilities**:
  - Message history management
  - Real-time message synchronization
  - Selected user state
  - WebSocket integration
  - API communication
- **Key Functions**:
  - `getMessages(userId)`: Fetches conversation history
  - `sendMessage(messageData)`: Sends new messages
  - `subscribeToMessages()`: Enables real-time updates
  - `unsubscribeFromMessages()`: Cleanup WebSocket listeners
  - `setSelectedUser(user)`: Manages active conversation
- **State Properties**:
  - `messages`: Array of message objects
  - `selectedUser`: Currently active conversation user
  - `isMessagesLoading`: Loading state for message fetching

## Features

### 💬 **Real-Time Messaging**

- WebSocket-based instant messaging
- Message delivery confirmation
- Typing indicators (future enhancement)
- Online/offline status

### 📱 **Responsive Design**

- Desktop: Side-by-side chat window
- Mobile: Full-screen modal experience
- Touch-optimized interactions
- Adaptive layouts

### 🖼️ **Rich Media Support**

- Text messages with emoji support
- Image attachments
- File upload handling
- Media preview and display

### 👥 **Match Management**

- Visual match gallery
- Conversation history
- User profile integration
- Match status tracking

### 🎨 **User Experience**

- Smooth message threading
- Auto-scroll to new messages
- Loading states and skeletons
- Error handling and recovery
- Message timestamps

### 🔒 **Security & Privacy**

- Authenticated message sending
- User verification
- Secure file uploads
- Privacy controls

## Data Flow

```
ChatContainer
    ├── Header (navigation)
    ├── MatchesDisplay (when no chat selected)
    ├── ChatSidebar (when user clicked)
    └── ChatWindow/ChatModal (when conversation active)
        ├── ChatHeader
        ├── Message Thread
        └── MessageInput

Store: useChatStore
    ├── WebSocket connection
    ├── Message state management
    └── API communication
```

## API Integration

### Endpoints Used

- `GET /api/messages/:userId` - Fetch conversation history
- `POST /api/messages/send/:userId` - Send new message

### WebSocket Events

- `newMessage` - Receive real-time messages
- Connection management for real-time updates

### Data Structures

```javascript
// Message Object
{
  _id: string,
  senderId: string,
  receiverId: string,
  text?: string,
  image?: string,
  createdAt: Date
}

// User Match Object
{
  _id: string,
  user_id: string,
  dogs_name: string,
  imageUrl: string,
  // ... other profile fields
}

// Chat State
{
  messages: Message[],
  selectedUser: User | null,
  isMessagesLoading: boolean
}
```

## File Structure

```
/components/chat/
├── ChatContainer.jsx        # Main container (44 lines)
├── ChatWindow.jsx          # Desktop chat interface (89 lines)
├── ChatModal.jsx           # Mobile chat interface
├── ChatSidebar.jsx         # Conversation list
├── MatchesDisplay.jsx      # Match gallery
├── ChatHeader.jsx          # Chat header component
├── MessageInput.jsx        # Message composition
└── index.js               # Barrel exports

/store/
└── useChatStore.js         # Zustand chat store (65 lines)

/hooks/
└── useIsMobile.js          # Mobile detection hook
```

## Usage Examples

### Basic Chat Implementation

```javascript
import { ChatContainer } from '../components/chat'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="dashboard">
      <ChatContainer user={user} />
      {/* Other dashboard components */}
    </div>
  )
}
```

### Using Chat Store

```javascript
import { useChatStore } from '../store/useChatStore'

const MyComponent = () => {
  const { messages, selectedUser, sendMessage, setSelectedUser } =
    useChatStore()

  const handleSendMessage = async (text) => {
    await sendMessage({ text })
  }

  const selectConversation = (user) => {
    setSelectedUser(user)
  }
}
```

### Custom Message Input

```javascript
import { MessageInput } from '../components/chat'

;<MessageInput
  onSendMessage={handleSendMessage}
  placeholder="Type your message..."
  disabled={!selectedUser}
/>
```

## Dependencies

- **zustand**: State management
- **socket.io-client**: Real-time WebSocket communication
- **axios**: HTTP API calls
- **react-hot-toast**: User notifications
- **lucide-react**: Icons (likely used in UI)

## Performance Considerations

- **Message Pagination**: Load messages in chunks for large conversations
- **WebSocket Management**: Proper connection cleanup and reconnection
- **Image Optimization**: Compress and resize uploaded images
- **Memory Management**: Clean up message listeners on unmount
- **Lazy Loading**: Load conversation history on demand

## Mobile Optimization

- **Touch Gestures**: Optimized for mobile interactions
- **Modal Interface**: Full-screen chat experience
- **Keyboard Handling**: Proper keyboard behavior on mobile
- **Responsive Images**: Adaptive image sizing

## Accessibility

- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals
- **High Contrast**: Support for high contrast modes
- **Text Scaling**: Responsive to user text size preferences

## Security Considerations

- **Message Validation**: Input sanitization and validation
- **File Upload Security**: Secure image upload handling
- **Authentication**: Verified user sessions
- **Rate Limiting**: Prevent message spam
- **Content Filtering**: Basic content moderation

## Future Enhancements

### 🚀 **Advanced Features**

- **Typing Indicators**: Show when users are typing
- **Message Reactions**: Emoji reactions to messages
- **Message Search**: Search within conversation history
- **Voice Messages**: Audio message support
- **Video Calls**: Integrated video calling
- **Message Encryption**: End-to-end encryption

### 📊 **Analytics & Insights**

- **Read Receipts**: Message read status
- **Response Time Tracking**: Conversation analytics
- **User Engagement Metrics**: Chat activity tracking

### 🎨 **UI/UX Improvements**

- **Custom Themes**: Personalized chat themes
- **Message Formatting**: Rich text support
- **Sticker Support**: Custom stickers and GIFs
- **Dark Mode**: Theme switching support

### 🔧 **Technical Improvements**

- **Offline Support**: Queue messages when offline
- **Message Caching**: Local message storage
- **Push Notifications**: Real-time notifications
- **Multi-device Sync**: Sync across devices
- **Performance Monitoring**: Chat performance metrics

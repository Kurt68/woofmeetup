# Dashboard Components

## Overview

The Dashboard components provide a Tinder-like swiping interface for dog owners to discover and match with other dogs in their area. The system includes location-based filtering, distance selection, and swipe-based matching functionality.

## Component Structure

### Main Components

#### `SwipeContainer.jsx` (Main Container)

- **Purpose**: Orchestrates the entire swiping experience
- **Responsibilities**:
  - Manages geolocation requirements
  - Renders swipeable cards for potential matches
  - Provides distance filtering controls
  - Coordinates between child components
- **Props**:
  - `userId`: Current user's ID
  - `longitude`, `latitude`: User's location coordinates
  - `filteredMeetupTypeUsers`: Array of potential matches
  - `selectDistance`: Current search radius
  - `onLocationUpdate`: Callback for location updates
  - `onSwipe`: Callback for swipe actions
  - `onCardLeftScreen`: Callback when card exits screen
  - `onDistanceChange`: Callback for distance filter changes

#### `SwipeCard.jsx` (Individual Match Card)

- **Purpose**: Displays individual dog profiles as swipeable cards
- **Responsibilities**:
  - Shows dog photo, name, age, and description
  - Displays distance from current user
  - Shows meetup type preference with color coding
  - Handles swipe gestures (left/right only)
- **Props**:
  - `user`: Dog profile data object
  - `onSwipe`: Callback function for swipe direction
  - `onCardLeftScreen`: Callback when card leaves screen
- **Features**:
  - Uses `react-tinder-card` for swipe functionality
  - Prevents vertical swiping (up/down disabled)
  - Color-coded meetup type indicators:
    - Exercise Buddy
    - Play Dates
    - Walk Companion

#### `GeolocationButton.jsx` (Location Access)

- **Purpose**: Handles user location permission and acquisition
- **Responsibilities**:
  - Requests geolocation permission
  - Updates user location in database
  - Provides user feedback during location process
- **Props**:
  - `userId`: Current user's ID
  - `onLocationUpdate`: Callback to update parent with coordinates
- **Features**:
  - Browser geolocation API integration
  - Error handling for location failures
  - Loading states during location acquisition

#### `DistanceSelector.jsx` (Search Radius Control)

- **Purpose**: Allows users to adjust their search radius
- **Responsibilities**:
  - Provides distance selection interface
  - Updates search parameters
  - Triggers new user searches based on radius
- **Props**:
  - `selectDistance`: Current selected distance
  - `onDistanceChange`: Callback for distance updates
- **Features**:
  - Multiple distance options (typically 5, 10, 25, 50+ miles)
  - Real-time filtering of potential matches
  - URL parameter synchronization

## Supporting Hooks

### `useDashboardData.js`

- **Purpose**: Manages all dashboard-related data and API calls
- **Responsibilities**:
  - Fetches current user profile
  - Retrieves potential matches based on preferences
  - Handles distance filter changes
  - Filters out already matched users
  - Provides helpful hints for empty results
- **Key Functions**:
  - `getUser()`: Fetches current user data
  - `getMeetupTypeUsers()`: Gets potential matches
  - `handleDistanceChange()`: Updates search radius
  - `getFilteredUsers()`: Filters matches by location and previous swipes

### `useGeolocation.js`

- **Purpose**: Handles browser geolocation functionality
- **Responsibilities**:
  - Manages location permission requests
  - Stores and updates coordinates
  - Handles geolocation errors
- **Returns**: `{ longitude, latitude, updateLocation }`

### `useSwipeLogic.js`

- **Purpose**: Manages swipe actions and match creation
- **Responsibilities**:
  - Processes left/right swipe decisions
  - Creates matches when both users swipe right
  - Updates user profiles with swipe history
  - Provides feedback for swipe actions
- **Returns**: `{ swiped, outOfFrame }`

## Features

### 🎯 **Location-Based Matching**

- GPS-based user discovery
- Configurable search radius
- Distance display on cards
- Location permission handling

### 🃏 **Swipe Interface**

- Tinder-style card swiping
- Left swipe: Pass
- Right swipe: Like
- Smooth animations and transitions
- Card stack management

### 🎨 **Visual Design**

- Polaroid-style photo cards
- Color-coded meetup preferences
- Responsive design for mobile/desktop
- Loading states and skeletons

### 🔍 **Smart Filtering**

- Excludes already matched users
- Filters by meetup type preferences
- Distance-based filtering
- Empty state handling with helpful hints

### 📱 **User Experience**

- Intuitive swipe gestures
- Real-time distance updates
- Helpful onboarding hints
- Error handling and recovery

## Data Flow

```
Dashboard Page
    ↓
SwipeContainer
    ├── GeolocationButton (if no location)
    ├── SwipeCard[] (for each potential match)
    └── DistanceSelector

Hooks:
- useDashboardData: API calls and data management
- useGeolocation: Location services
- useSwipeLogic: Match processing
```

## API Integration

### Endpoints Used

- `GET /api/auth/user` - Fetch current user profile
- `GET /api/auth/meetup-type-users` - Get potential matches
- `PUT /api/auth/user-select-distance` - Update search radius
- `PUT /api/auth/user` - Update user location
- `PUT /api/auth/addmatch` - Create matches from swipes

### Data Structures

```javascript
// User Profile
{
  user_id: string,
  dogs_name: string,
  age: number,
  about: string,
  imageUrl: string,
  meetup_type: 'Exercise Buddy' | 'Play Dates' | 'Walk Companion',
  matches: Array<{user_id: string}>,
  distance_to_other_users: number
}

// Swipe Action
{
  userId: string,
  matchedUserId: string,
  direction: 'left' | 'right'
}
```

## File Structure

```
/components/dashboard/
├── SwipeContainer.jsx        # Main container (43 lines)
├── SwipeCard.jsx            # Individual match card (45 lines)
├── GeolocationButton.jsx    # Location access component
├── DistanceSelector.jsx     # Search radius control
└── index.js                 # Barrel exports

/hooks/dashboard/
├── useDashboardData.js      # Data management (133 lines)
├── useGeolocation.js        # Location services
├── useSwipeLogic.js         # Match processing
└── index.js                 # Hook exports

/pages/
└── Dashboard.jsx            # Main dashboard page (53 lines)
```

## Usage Examples

### Basic Dashboard Implementation

```javascript
import { SwipeContainer } from '../components/dashboard'
import {
  useDashboardData,
  useGeolocation,
  useSwipeLogic,
} from '../hooks/dashboard'

const Dashboard = () => {
  const { longitude, latitude, updateLocation } = useGeolocation()
  const { user, selectDistance, getFilteredUsers, handleDistanceChange } =
    useDashboardData(userId)
  const { swiped, outOfFrame } = useSwipeLogic(userId, getUser)

  const filteredUsers = user ? getFilteredUsers(longitude, latitude) : []

  return (
    <SwipeContainer
      userId={userId}
      longitude={longitude}
      latitude={latitude}
      filteredMeetupTypeUsers={filteredUsers}
      selectDistance={selectDistance}
      onLocationUpdate={updateLocation}
      onSwipe={swiped}
      onCardLeftScreen={outOfFrame}
      onDistanceChange={handleDistanceChange}
    />
  )
}
```

### Custom Swipe Card

```javascript
import { SwipeCard } from '../components/dashboard'

;<SwipeCard
  user={dogProfile}
  onSwipe={(direction, userId) => {
    console.log(`Swiped ${direction} on user ${userId}`)
  }}
  onCardLeftScreen={(dogName) => {
    console.log(`${dogName}'s card left the screen`)
  }}
/>
```

## Dependencies

- **react-tinder-card**: Swipe gesture handling
- **axios**: API communication
- **react-router-dom**: URL parameter management
- **react-hot-toast**: User notifications

## Performance Considerations

- **Lazy Loading**: Cards are rendered as needed
- **Geolocation Caching**: Location is cached to avoid repeated requests
- **API Optimization**: Distance changes trigger immediate re-fetching
- **Memory Management**: Proper cleanup of event listeners and timers

## Accessibility

- Keyboard navigation support for swipe actions
- Screen reader friendly card descriptions
- High contrast mode compatibility
- Touch gesture alternatives

## Future Enhancements

- **Advanced Filters**: Age range, breed preferences, activity level
- **Undo Functionality**: Allow users to undo recent swipes
- **Batch Loading**: Load cards in batches for better performance
- **Offline Support**: Cache profiles for offline browsing
- **Analytics**: Track swipe patterns and match success rates
- **Push Notifications**: Alert users of new potential matches

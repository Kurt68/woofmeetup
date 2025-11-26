import { ChatContainer } from '../components/chat'
import { SwipeContainer } from '../components/dashboard'
import { PageHead } from '../components/PageHead'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/useAuthStore'
import {
  useGeolocation,
  useDashboardData,
  useSwipeLogic,
} from '../hooks/dashboard'
import { trackProfileMatch, trackProfileLike } from '../services/analyticsService'

const Dashboard = () => {
  const { user } = useAuthStore()
  const userId = user?.user_id
  const location = useLocation()

  // Track component lifecycle
  useEffect(() => {
    console.log('🟢 [Dashboard] Component mounted')
    return () => {
      console.log('🟠 [Dashboard] Component UNMOUNTING')
    }
  }, [])

  // Handle payment success redirect from PaymentSuccess page
  useEffect(() => {
    if (location.state?.fromPayment) {
      // Refresh user data to ensure latest credits are loaded
      useAuthStore.getState().checkAuth()

      // Use toast ID to prevent duplicate toasts
      toast.success('Payment successful! Your credits have been added.', {
        id: 'payment-success',
        duration: 4000,
        icon: '🎉',
      })

      // Clear the state to prevent showing toast on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Custom hooks for separation of concerns
  const { longitude, latitude, updateLocation } = useGeolocation()
  const {
    selectDistance,
    getUser,
    handleDistanceChange,
    getFilteredUsers,
    getMeetupTypeUsers,
  } = useDashboardData(userId)
  const { swiped, outOfFrame } = useSwipeLogic(userId, getUser)

  // Refetch users when location updates
  useEffect(() => {
    if (longitude && latitude) {
      console.log('📍 Location updated, fetching meetup type users:', {
        longitude,
        latitude,
      })
      getMeetupTypeUsers()
    } else {
      console.log('⏳ Waiting for location data. Currently:', {
        longitude,
        latitude,
      })
    }
  }, [longitude, latitude, getMeetupTypeUsers])

  // Listen for match/unmatch events via Socket.IO
  const socket = useAuthStore((state) => state.socket)
  useEffect(() => {
    if (!socket) return

    const handleNewMatch = () => {
      getUser()
      useAuthStore.getState().checkAuth()
      trackProfileMatch()
      toast.success('You have a new match! 🎉', {
        duration: 3000,
      })
    }

    const handleUserUnmatched = () => {
      getUser()
      useAuthStore.getState().checkAuth()
      toast.success('You have been unmatched', {
        duration: 3000,
      })
    }

    const handleUserAccountDeleted = () => {
      getUser()
      useAuthStore.getState().checkAuth()
      toast.info('A user you matched with has deleted their account', {
        duration: 3000,
      })
    }

    const handleUserLiked = (data) => {
      trackProfileLike()
      toast.success(`❤️ ${data.fromUserName} likes you!`, {
        duration: 4000,
        icon: false,
      })
    }

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

  // Get filtered users based on current location
  const filteredMeetupTypeUsers = user
    ? getFilteredUsers(longitude, latitude)
    : []

  // for testing Error Boundary
  // throw new Error('Component')
  return (
    <>
      <PageHead
        title="Dashboard"
        description="Discover dog owners and arrange meetups. Find your perfect match on Woof Meetup."
      />
      {user && (
        <main className="dashboard" role="main">
          <section aria-label="Messages and matches">
            <ChatContainer user={user} />
          </section>
          <section aria-label="Dog profiles and swiping">
            <SwipeContainer
              user={user}
              userId={userId}
              longitude={longitude}
              latitude={latitude}
              filteredMeetupTypeUsers={filteredMeetupTypeUsers}
              selectDistance={selectDistance}
              onLocationUpdate={updateLocation}
              onSwipe={swiped}
              onCardLeftScreen={outOfFrame}
              onDistanceChange={handleDistanceChange}
            />
          </section>
        </main>
      )}
    </>
  )
}

export default Dashboard

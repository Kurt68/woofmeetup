import { ChatContainer } from '../components/chat'
import { SwipeContainer } from '../components/dashboard'
import { useCookies } from 'react-cookie'
import {
  useGeolocation,
  useDashboardData,
  useSwipeLogic,
} from '../hooks/dashboard'

const Dashboard = () => {
  const [cookies] = useCookies('user')
  const userId = cookies.UserId

  // Custom hooks for separation of concerns
  const { longitude, latitude, updateLocation } = useGeolocation()
  const {
    user,
    selectDistance,
    getUser,
    handleDistanceChange,
    getFilteredUsers,
  } = useDashboardData(userId)
  const { swiped, outOfFrame } = useSwipeLogic(userId, getUser)

  // Get filtered users based on current location
  const filteredMeetupTypeUsers = user
    ? getFilteredUsers(longitude, latitude)
    : []

  // for testing Error Boundary
  // throw new Error('Component')
  return (
    <>
      {user && (
        <div className="dashboard">
          <ChatContainer user={user} />
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
        </div>
      )}
    </>
  )
}

export default Dashboard

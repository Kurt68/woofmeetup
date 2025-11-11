import SwipeCard from './SwipeCard'
import GeolocationButton from './GeolocationButton'
import DistanceSelector from './DistanceSelector'

const SwipeContainer = ({
  userId,
  longitude,
  latitude,
  filteredMeetupTypeUsers,
  selectDistance,
  onLocationUpdate,
  onSwipe,
  onCardLeftScreen,
  onDistanceChange,
}) => {
  return (
    <div className="swipe-container">
      {!longitude && !latitude ? (
        <GeolocationButton
          userId={userId}
          onLocationUpdate={onLocationUpdate}
        />
      ) : null}

      <div className="polaroid-container">
        {longitude && latitude
          ? filteredMeetupTypeUsers?.map((filteredMeetupTypeUser) => (
              <SwipeCard
                key={filteredMeetupTypeUser.user_id}
                user={filteredMeetupTypeUser}
                onSwipe={onSwipe}
                onCardLeftScreen={onCardLeftScreen}
              />
            ))
          : null}
      </div>

      <DistanceSelector
        selectDistance={selectDistance}
        onDistanceChange={onDistanceChange}
      />
    </div>
  )
}

export default SwipeContainer

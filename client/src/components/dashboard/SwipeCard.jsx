import TinderCard from 'react-tinder-card'

const SwipeCard = ({ user, onSwipe, onCardLeftScreen }) => {
  return (
    <TinderCard
      className="swipe"
      key={user.user_id}
      onSwipe={(dir) => onSwipe(dir, user.user_id)}
      onCardLeftScreen={() => onCardLeftScreen(user.dogs_name)}
      preventSwipe={['up', 'down']}
    >
      <div className="polaroid">
        <div
          className="photo"
          style={{
            backgroundImage: 'url(' + user.imageUrl + ')',
          }}
        >
          <div className="caption">
            <p className="dog-info">
              {user.dogs_name}
              {', '}
              Age {user.age}
              <br />
              {user.distance_to_other_users} miles from you
              <br />
              {user.about}
              <span
                className={
                  user.meetup_type === 'Exercise Buddy'
                    ? 'exercise-buddy'
                    : user.meetup_type === 'Play Dates'
                    ? 'play-dates'
                    : user.meetup_type === 'Walk Companion'
                    ? 'walk-companion'
                    : ''
                }
              />
            </p>
          </div>
        </div>
      </div>
    </TinderCard>
  )
}

export default SwipeCard

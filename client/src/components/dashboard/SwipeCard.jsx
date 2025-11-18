import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import TinderCard from 'react-tinder-card'
import ProfileModal from './ProfileModal'

const SwipeCard = ({ user, onSwipe, onCardLeftScreen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  return (
    <>
      <TinderCard
        className="swipe"
        key={user.user_id}
        onSwipe={(dir) => onSwipe(dir, user.user_id)}
        onCardLeftScreen={() => onCardLeftScreen(user.dogs_name)}
        preventSwipe={['up', 'down']}
      >
        <figure className="polaroid">
          <div
            className="photo"
            style={{
              backgroundImage: 'url(' + user.imageUrl + ')',
            }}
            role="img"
            aria-label={`${user.dogs_name}, age ${user.age}`}
          >
            <button
              className="card-info-button"
              onClick={handleOpenModal}
              aria-label="View full profile"
              type="button"
            >
              <ChevronUp size={40} />
            </button>
            <figcaption className="caption">
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
                  aria-hidden="true"
                />
              </p>
            </figcaption>
          </div>
        </figure>
      </TinderCard>

      {isModalOpen && (
        <ProfileModal user={user} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}

export default SwipeCard

import { useState, useEffect } from 'react'
import { Ellipsis, Images } from 'lucide-react'
import TinderCard from 'react-tinder-card'
import ProfileModal from './ProfileModal'

const SwipeCard = ({ user, onSwipe, onCardLeftScreen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Initialize images array: [dogImage, userProfileImage]
  // Note: Only include profileImageUrl if it exists (not as fallback)
  const images = [user.imageUrl, user.profileImageUrl]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hideSwipeIndicatorAnimation, setHideSwipeIndicatorAnimation] =
    useState(false)

  // Check if user has already seen the swipe indicator animation in this session
  useEffect(() => {
    const hasSeenSwipeIndicator = sessionStorage.getItem(
      'hasSeenSwipeIndicator'
    )
    if (hasSeenSwipeIndicator) {
      setHideSwipeIndicatorAnimation(true)
    }
  }, [])

  // Check if there's actually a second distinct image
  const hasProfileImage =
    user.profileImageUrl && user.profileImageUrl !== user.imageUrl

  const handleToggleImage = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasProfileImage) {
      setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0))
      // Mark that user has seen the swipe indicator animation
      sessionStorage.setItem('hasSeenSwipeIndicator', 'true')
      setHideSwipeIndicatorAnimation(true)
    }
  }

  const handleCardClick = (e) => {
      console.log('handleCardClick fired, isModalOpen:', isModalOpen)
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  // Determine if we're showing the profile image (user's image)
  const isShowingProfileImage = currentImageIndex === 1 && hasProfileImage

  return (
    <>
      <TinderCard
        className="swipe"
        key={user.user_id}
        onSwipe={(dir) => onSwipe(dir, user.user_id)}
        onCardLeftScreen={() => onCardLeftScreen(user.dogs_name)}
        preventSwipe={['up', 'down']}
      >
        <figure className="polaroid" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          <div
            className="photo"
            style={{
              backgroundImage: 'url(' + images[currentImageIndex] + ')',
            }}
            role="img"
            aria-label={
              isShowingProfileImage
                ? `${user.userName}, age ${user.userAge}`
                : `${user.dogs_name}, age ${user.age}`
            }
          >
          {hasProfileImage && (
            <button
              className={`swipe-indicator ${
                hideSwipeIndicatorAnimation ? 'animation-hidden' : ''
              }`}
              onClick={handleToggleImage}
              aria-label="Toggle to see more photos"
              type="button"
            >
              <div className="swipe-indicator-icons" aria-hidden="true">
                <Images size={60} />
                <Ellipsis size={60} />
              </div>
            </button>
          )}
          <figcaption className="caption">
            <p className="dog-info dog-info-truncated">
              {isShowingProfileImage ? (
                <>
                  {user.userName}
                  {', '}
                  Age {user.userAge}
                  <br />
                  {user.userAbout}
                </>
              ) : (
                <>
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
                </>
              )}
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

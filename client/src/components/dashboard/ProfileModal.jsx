import { X, Heart } from 'lucide-react'
import { useEffect } from 'react'
import { sanitizeImageUrl } from '../../utilities/sanitizeUrl'
import { useLike } from '../../hooks/dashboard/useLike'

const ProfileModal = ({ user, onClose }) => {
  const { liked, loading, createLike, checkIfLiked } = useLike()

  useEffect(() => {
    if (user?._id) {
      checkIfLiked(user._id)
    }
  }, [user?._id, checkIfLiked])

  const handleLike = async () => {
    if (user?._id) {
      await createLike(user._id)
    }
  }

  if (!user) return null

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">About Me and My Dog</h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close profile"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <div className="profile-modal-scroll">
          <div className="profile-modal-gallery">
            <img
              src={sanitizeImageUrl(user.imageUrl)}
              alt={user.dogs_name}
              className="profile-modal-image dog-image"
            />
            {user.profileImageUrl && user.profileImageUrl !== user.imageUrl && (
              <img
                src={sanitizeImageUrl(user.profileImageUrl)}
                alt={user.userName}
                className="profile-modal-image user-image"
              />
            )}
          </div>

          <div className="profile-modal-info">
            <div className="profile-section">
              <div className="profile-details">
                <p>
                  <strong>{user.dogs_name}</strong>
                  {user.age && `, Age ${user.age}`}
                </p>
                <p className="profile-distance">
                  {user.distance_to_other_users} miles from you
                </p>
                {user.meetup_type && (
                  <p className="profile-meetup-type">
                    <strong>Looking for:</strong> {user.meetup_type}
                  </p>
                )}
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-details">
                <p>
                  <strong>{user.userName}</strong>
                  {user.userAge && `, Age ${user.userAge}`}
                </p>
                {user.userAbout && (
                  <div className="profile-bio">
                    <p>{user.userAbout}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button
            className={`secondary-button profile-modal-like-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={loading}
            aria-label={liked ? 'Unlike profile' : 'Like profile'}
            type="button"
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal

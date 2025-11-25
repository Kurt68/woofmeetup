import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { sanitizeImageUrl } from '../utilities/sanitizeUrl'
import { PageHead } from '../components/PageHead'
import { SocialShareButtons } from '../components/share'
import { Nav } from '../components/layout'
import { X } from 'lucide-react'
import '../pages/PublicProfile.css'

const PublicProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { fetchPublicProfile, isAuthenticated } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUsingLastKnownDistance, setIsUsingLastKnownDistance] =
    useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        let profileData = await fetchPublicProfile(userId)

        if (!isAuthenticated && !profileData.distance_to_other_users) {
          const lastKnownCoords = localStorage.getItem('lastKnownCoordinates')
          if (lastKnownCoords) {
            const coords = JSON.parse(lastKnownCoords)
            profileData = await fetchPublicProfile(userId, coords)
            if (profileData.distance_to_other_users) {
              setIsUsingLastKnownDistance(true)
            }
          }
        }

        console.log('📸 Public profile loaded:', profileData)
        setProfile(profileData)
        setLoading(false)
      } catch (err) {
        console.error('❌ Error loading profile:', err)
        setError('Profile not found or unavailable')
        setLoading(false)
      }
    }

    if (userId) {
      loadProfile()
    }
  }, [userId, fetchPublicProfile, isAuthenticated])

  if (loading) {
    return (
      <>
        <PageHead title="Loading..." />
          <div className="overlay">
            <Nav minimal={true} />
            <div className="profile-modal-overlay">
              <div className="profile-modal">
                <div className="profile-modal-scroll">
                  <div className="loading">Loading profile...</div>
                </div>
              </div>
            </div>
          </div>
      </>
    )
  }

  if (error || !profile) {
    return (
      <>
        <PageHead title="Profile Not Found" />
          <div className="overlay">
            <Nav minimal={true} />
            <div className="profile-modal-overlay">
              <div className="profile-modal">
                <div className="profile-modal-header">
                  <button
                    className="profile-modal-close"
                    onClick={() => navigate('/')}
                    aria-label="Close profile"
                    type="button"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="profile-modal-scroll">
                  <div className="error-message">
                    <h2>Profile Not Found</h2>
                    <p>{error || 'This profile is no longer available.'}</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </>
    )
  }

  const pageTitle = `${profile.dogs_name} - Woof Meetup`
  const pageDescription = `Meet ${profile.userName} and ${profile.dogs_name}. ${
    profile.userAbout || 'Looking for dog meetups on Woof Meetup.'
  }`

  return (
    <>
      <PageHead title={pageTitle} description={pageDescription} />
        <div className="overlay">
          <Nav minimal={true} />
          <div className="profile-modal-overlay">
            <div className="profile-modal">
              <div className="profile-modal-header">
                <h2 className="profile-modal-title">About Me and My Dog</h2>
                <div className="social-share-buttons">
                  <SocialShareButtons profile={profile} />
                </div>
                <button
                  className="profile-modal-close"
                  onClick={() => navigate('/')}
                  aria-label="Close profile"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="profile-modal-scroll">
                <div className="profile-modal-gallery">
                  {profile.imageUrl ? (
                    <img
                      src={sanitizeImageUrl(profile.imageUrl)}
                      alt={profile.dogs_name}
                      className="profile-modal-image dog-image"
                      onError={(e) =>
                        console.error(
                          '❌ Dog image load error:',
                          profile.imageUrl,
                          e
                        )
                      }
                      onLoad={() =>
                        console.log('✅ Dog image loaded:', profile.imageUrl)
                      }
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      No dog photo available
                    </div>
                  )}
                  {profile.profileImageUrl &&
                    profile.profileImageUrl !== profile.imageUrl && (
                      <img
                        src={sanitizeImageUrl(profile.profileImageUrl)}
                        alt={profile.userName}
                        className="profile-modal-image user-image"
                        onError={(e) =>
                          console.error(
                            '❌ User image load error:',
                            profile.profileImageUrl,
                            e
                          )
                        }
                        onLoad={() =>
                          console.log(
                            '✅ User image loaded:',
                            profile.profileImageUrl
                          )
                        }
                      />
                    )}
                </div>

                <div className="profile-modal-info">
                  <div className="profile-section">
                    <div className="profile-details">
                      <p>
                        <strong>{profile.dogs_name}</strong>
                        {profile.age && `, Age ${profile.age}`}
                      </p>
                      {profile.distance_to_other_users && (
                        <p className="profile-distance">
                          {isUsingLastKnownDistance
                            ? 'Last known distance is '
                            : ''}
                          {profile.distance_to_other_users} miles from you
                        </p>
                      )}
                      {/* {profile.about && (
                        <div className="profile-bio">
                          <p>{profile.about}</p>
                        </div>
                      )} */}
                      {profile.meetup_type && (
                        <p className="profile-meetup-type">
                          <strong>Looking for:</strong> {profile.meetup_type}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="profile-section">
                    <div className="profile-details">
                      <p>
                        <strong>{profile.userName}</strong>
                        {profile.userAge && `, Age ${profile.userAge}`}
                      </p>
                      {profile.userAbout && (
                        <div className="profile-bio">
                          <p>{profile.userAbout}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button
                  className="secondary-button"
                  onClick={() => navigate('/')}
                  type="button"
                >
                  Explore More Profiles
                </button>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

export default PublicProfile

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { sanitizeImageUrl } from '../utilities/sanitizeUrl'
import { PageHead } from '../components/PageHead'
import { SocialShareButtons } from '../components/share'
import { Nav } from '../components/layout'
import { X } from 'lucide-react'
import '../pages/PublicProfile.css'

const STORAGE_KEY = 'lastKnownCoordinates'
const MONGODB_OBJECTID_REGEX = /^[0-9a-f]{24}$/i
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_RETRIES = 1
const REFETCH_TIMEOUT_MS = 5000

const isValidUserId = (id) => {
  return id && typeof id === 'string' && (MONGODB_OBJECTID_REGEX.test(id) || UUID_REGEX.test(id))
}

const isValidCoordinates = (coords) => {
  return (
    coords &&
    typeof coords === 'object' &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  )
}

const isValidProfile = (profile) => {
  return (
    profile &&
    typeof profile === 'object' &&
    profile.dogs_name &&
    profile.userName &&
    (profile.user_id || profile._id)
  )
}

const PublicProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { fetchPublicProfile, isAuthenticated } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleNavigateHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const memoizedPageData = useMemo(
    () => ({
      title: profile ? `${profile.dogs_name || 'Dog'} - Woof Meetup` : 'Profile Not Found',
      description: profile
        ? `Meet ${profile.userName || 'User'} and ${profile.dogs_name || 'their dog'}. ${
            profile.userAbout || 'Looking for dog meetups on Woof Meetup.'
          }`
        : 'This profile is no longer available.',
    }),
    [profile]
  )

  useEffect(() => {
    if (!isValidUserId(userId)) {
      setError('Invalid profile URL')
      setLoading(false)
      return
    }

    const abortController = new AbortController()

    const loadProfile = async () => {
      try {
        setError(null)

        let profileData = await fetchPublicProfile(userId)

        if (!profileData) {
          throw new Error('Profile data is empty')
        }

        if (!isValidProfile(profileData)) {
          throw new Error('Profile missing required fields')
        }

        if (!isAuthenticated && !profileData.distance_to_other_users) {
          try {
            const lastKnownCoordsStr = localStorage.getItem(STORAGE_KEY)
            if (lastKnownCoordsStr) {
              const coords = JSON.parse(lastKnownCoordsStr)
              if (isValidCoordinates(coords)) {
                const refetchPromise = fetchPublicProfile(userId, coords)
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error('Refetch timeout')),
                    REFETCH_TIMEOUT_MS
                  )
                )

                try {
                  const refetchedData = await Promise.race([
                    refetchPromise,
                    timeoutPromise,
                  ])
                  if (refetchedData && isValidProfile(refetchedData)) {
                    profileData = refetchedData
                  }
                } catch (refetchErr) {
                  if (
                    refetchErr instanceof Error &&
                    refetchErr.message === 'Refetch timeout'
                  ) {
                    console.warn('Refetch with coordinates timed out, using first fetch')
                  } else {
                    console.warn('Failed to refetch with coordinates:', refetchErr)
                  }
                }
              }
            }
          } catch (storageErr) {
            console.error('Failed to load coordinates from storage:', storageErr)
          }
        }

        if (!abortController.signal.aborted) {
          setProfile(profileData)
          setLoading(false)
          setRetryCount(0)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMessage =
            err instanceof Error && err.message
              ? err.message
              : 'Profile not found or unavailable'
          setError(errorMessage)
          setLoading(false)

          if (retryCount < MAX_RETRIES) {
            console.warn(`Load failed, retrying (${retryCount + 1}/${MAX_RETRIES}):`, err)
            setRetryCount(retryCount + 1)
          } else {
            console.error('Failed to load profile after retries:', err)
          }
        }
      }
    }

    setLoading(true)
    loadProfile()

    return () => abortController.abort()
  }, [userId, fetchPublicProfile, isAuthenticated, retryCount])

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
                  onClick={handleNavigateHome}
                  aria-label="Close error message"
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

  return (
    <>
      <PageHead
        title={memoizedPageData.title}
        description={memoizedPageData.description}
      />
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
                  onClick={handleNavigateHome}
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
                      alt={profile.dogs_name || 'Dog photo'}
                      className="profile-modal-image dog-image"
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
                        alt={profile.userName || 'User photo'}
                        className="profile-modal-image user-image"
                      />
                    )}
                </div>

                <div className="profile-modal-info">
                  <div className="profile-section">
                    <div className="profile-details">
                      <p>
                        <strong>{profile.dogs_name || 'Unknown Dog'}</strong>
                        {profile.age && `, Age ${profile.age}`}
                      </p>
                      {profile.distance_to_other_users && (
                        <p className="profile-distance">
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
                        <strong>{profile.userName || 'Unknown User'}</strong>
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
                  onClick={handleNavigateHome}
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

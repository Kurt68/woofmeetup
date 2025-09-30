import { useState, useEffect, useCallback } from 'react'
import { Nav } from '../components/layout'
import ImageUpload from './ImageUpload'
import { SimpleImageUpload } from '../components/upload'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import CurrentImage from './CurrentImage'
import { Loader } from 'lucide-react'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const EditDogProfile = () => {
  const [removeImage, setRemoveImage] = useState(false)
  const [keepCurrentImage, setKeepCurrentImage] = useState(false)
  const [showSecondButton, setShowSecondButton] = useState(false)
  const [hideImageUpload, setHideImageUpload] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aboutError, setAboutError] = useState('')
  const [profileImageUploaded, setProfileImageUploaded] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)

  const [user, setUser] = useState({})

  const [cookies] = useCookies('user')
  const userId = cookies.UserId

  const [formData, setFormData] = useState({
    user_id: cookies.UserId,
    dogs_name: '',
    age: '',
    show_meetup_type: false,
    meetup_type: '',
    meetup_interest: '',
    about: '',
    current_user_search_radius: 10,
  })

  const getCurrentUserProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/current-user-profile`, {
        params: { userId },
      })
      setFormData(data)
    } catch (error) {
      console.error('getCurrentUserProfile error:', error.response.data)
    }
  }, [userId])

  useEffect(() => {
    getCurrentUserProfile()
  }, [getCurrentUserProfile, userId])

  const getUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        params: { userId },
      })
      setUser(response.data)
    } catch (err) {
      // Add proper error handling
      console.error('Error gettting user:', err)
      setError(
        err.response?.data?.message || 'Failed to get user. Please try again.'
      )
    }
  }, [userId])

  useEffect(() => {
    getUser()
  }, [getUser])

  let navigate = useNavigate()

  const patchCurrentUserProfile = async (e) => {
    e.preventDefault()

    // Block submit if About exceeds 26 chars
    if (typeof formData.about === 'string' && formData.about.length > 26) {
      setAboutError('About me must be 26 characters or fewer.')
      return
    } else {
      setAboutError('')
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.patch(`${API_URL}/user`, {
        formData,
      })
      const success = response.status === 200
      if (success) navigate('/dashboard')
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleChange = (e) => {
    const name = e.target.name
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value

    // Validate about field length (max 26 characters)
    if (name === 'about') {
      if (typeof value === 'string' && value.length > 26) {
        setAboutError('About me must be 26 characters or fewer.')
      } else {
        setAboutError('')
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const deleteImage = async () => {
    try {
      await axios.delete(`${API_URL}/image`, {
        params: { userId },
      })
      setRemoveImage(true)
    } catch (err) {
      // Add proper error handling
      console.error('Error deleting image:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete image. Please try again.'
      )
    }
  }

  const keepImage = () => {
    setKeepCurrentImage(true)
  }
  return (
    <>
      <div className="edit onboarding">
        <div className="background-color-edit">
          <Nav minimal={true} setShowModal={() => {}} showModal={false} />
          <h2 style={{ color: 'white' }}>Edit Your Dogs Profile</h2>
          <Link style={{ color: 'white' }} className="links" to="/dashboard">
            &lt;&lt; Back to Dashboard
          </Link>
          <br /> <br />
          <button className="edit-button" onClick={keepImage}>
            Keep Image
          </button>
          {(keepCurrentImage || showSecondButton) && (
            <div className="auth-modal">
              <form onSubmit={patchCurrentUserProfile}>
                <section>
                  <label htmlFor="dogs_name">
                    <strong>Dogs Name</strong>
                  </label>
                  <input
                    type="text"
                    id="dogs_name"
                    name="dogs_name"
                    placeholder="Dogs Name"
                    required={true}
                    value={formData.dogs_name}
                    onChange={handleChange}
                  />
                  <label htmlFor="age">
                    <strong>Age</strong>
                  </label>
                  <div className="multiple-input-container">
                    <input
                      type="number"
                      id="age"
                      name="age"
                      placeholder="Age"
                      required={true}
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  <label>
                    <strong>Choose a Meetup</strong>
                  </label>
                  <div className="multiple-input-container">
                    <input
                      type="radio"
                      id="meetup-type-play-dates"
                      name="meetup_type"
                      value="Play Dates"
                      onChange={handleChange}
                      checked={formData.meetup_type === 'Play Dates'}
                    />
                    <label htmlFor="meetup-type-play-dates">Play Dates</label>
                    <input
                      type="radio"
                      id="meetup-type-exercise-buddy"
                      name="meetup_type"
                      value="Exercise Buddy"
                      onChange={handleChange}
                      checked={formData.meetup_type === 'Exercise Buddy'}
                    />
                    <label htmlFor="meetup-type-exercise-buddy">
                      Exercise Buddy
                    </label>
                    <input
                      type="radio"
                      id="meetup-type-walk-companion"
                      name="meetup_type"
                      value="Walk Companion"
                      onChange={handleChange}
                      checked={formData.meetup_type === 'Walk Companion'}
                    />
                    <label htmlFor="meetup-type-walk-companion">
                      Walk Companion
                    </label>
                  </div>
                  <label>
                    <strong>Show Me</strong>
                  </label>
                  <div className="multiple-input-container">
                    <input
                      type="radio"
                      id="play-dates-interest"
                      name="meetup_interest"
                      value="Play Dates"
                      onChange={handleChange}
                      checked={formData.meetup_interest === 'Play Dates'}
                    />
                    <label htmlFor="play-dates-interest">Play Dates</label>
                    <input
                      type="radio"
                      id="exercise-buddy-interest"
                      name="meetup_interest"
                      value="Exercise Buddy"
                      onChange={handleChange}
                      checked={formData.meetup_interest === 'Exercise Buddy'}
                    />
                    <label htmlFor="exercise-buddy-interest">
                      Exercise Buddy
                    </label>
                    <input
                      type="radio"
                      id="walk-companion-interest"
                      name="meetup_interest"
                      value="Walk Companion"
                      onChange={handleChange}
                      checked={formData.meetup_interest === 'Walk Companion'}
                    />
                    <label htmlFor="walk-companion-interest">
                      Walk Companion
                    </label>
                    <input
                      type="radio"
                      id="all-meetup-types"
                      name="meetup_interest"
                      value="Show all meetup activites"
                      onChange={handleChange}
                      checked={
                        formData.meetup_interest === 'Show all meetup activites'
                      }
                    />
                    <label htmlFor="all-meetup-types">
                      Show all meetup activities
                    </label>
                  </div>
                  <label htmlFor="about">
                    <strong>About Me</strong>
                  </label>
                  <input
                    type="text"
                    id="about"
                    name="about"
                    required={true}
                    placeholder="I like to play ball..."
                    value={formData.about}
                    onChange={handleChange}
                  />
                  {aboutError && (
                    <p className="server-error" role="alert">
                      {aboutError}
                    </p>
                  )}
                  {/* <label htmlFor="show-meetup-type">
                    Show meetup type on profile
                  </label>
                  <input
                    type="checkbox"
                    id="show-meetup-type"
                    name="show_meetup_type"
                    onChange={handleChange}
                    checked={formData.show_meetup_type}
                  /> */}
                  <input
                    type="hidden"
                    required={true}
                    value={formData.current_user_search_radius}
                    onChange={handleChange}
                  />

                  <SimpleImageUpload
                    setImageUploaded={setProfileImageUploaded}
                    setImageSelected={setImageSelected}
                    currentImageUrl={user.profileImageUrl}
                    showCurrentImage={true}
                  />

                  <br />
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      aboutError.length > 0 ||
                      (imageSelected && !profileImageUploaded)
                    }
                  >
                    {isLoading ? (
                      <Loader className="spin" size={28} />
                    ) : (
                      'Submit'
                    )}
                  </button>
                  {error && <p className="server-error">{error}</p>}
                </section>
              </form>
            </div>
          )}
          {!removeImage
            ? !removeImage && (
                <CurrentImage user={user} deleteImage={deleteImage} />
              )
            : !hideImageUpload && (
                <div className="auth-modal">
                  <ImageUpload
                    setShowSecondButton={setShowSecondButton}
                    setHideImageUpload={setHideImageUpload}
                  />
                </div>
              )}
        </div>
      </div>
    </>
  )
}
export default EditDogProfile

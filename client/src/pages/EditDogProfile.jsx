import { Nav } from '../components/layout'
import { OnboardingForm } from '../components/onboarding'
import { PageHead } from '../components/PageHead'
import axiosInstance from '../config/axiosInstance'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { formatSentenceCase } from '../utilities/formatSentenceCase'
import { useAuthStore } from '../store/useAuthStore'
import {
  sanitizeErrorMessage,
  sanitizeImageUrl,
} from '../utilities/sanitizeUrl'
import { trackDogProfileUpdated } from '../services/analyticsService'

/**
 * EditDogProfile - Edit existing user profile with image previews
 *
 * Reuses the OnboardingForm component with edit-specific behavior:
 * - Fetches existing profile data on mount via /api/auth/current-user-profile
 * - Receives signed CloudFront URLs for existing images (valid for 24 hours)
 * - Shows image previews with "Current Dog Photo" / "Current Profile Photo" labels
 * - Allows uploading new images or keeping existing ones
 * - Submits changes back to the server
 *
 * State Management:
 * - formData: Pre-populated from API response
 * - currentDogImageUrl: Signed URL for dog image (from API)
 * - currentProfileImageUrl: Signed URL for profile image (from API)
 * - dogImageURL: Blob URL of newly selected dog image (null until selected)
 * - New dog images upload to POST /api/auth/image
 * - Profile images upload to PUT /api/auth/profile-image
 * - Form submission PATCHes to /api/auth/user
 *
 * Edit vs New Image Behavior:
 * - Existing images: Shown with preview and label, can be replaced with new image
 * - New selection: Temporarily hides existing preview while editing
 * - Remove without uploading: Reverts to showing existing image
 * - Upload successful: Clears new selection, existing image remains (will be refreshed on next visit)
 *
 * Validation:
 * - About (dog): 26 characters max
 * - User About: Unlimited characters (paragraph support)
 * - Text fields: Sentence case formatting
 * - Image uploads: Handled by respective upload components
 *
 * Navigation:
 * - Back button: Link to /dashboard
 * - Submit success: Navigates to /dashboard
 * - Fetch failure: Error displayed, user can retry
 */
const EditDogProfile = () => {
  const { user, checkAuth } = useAuthStore()
  const userId = user?.user_id
  const navigate = useNavigate()

  // Track component lifecycle
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('🔵 [EditProfile] Component mounted')
    }
    return () => {
      if (import.meta.env.MODE === 'development') {
        console.log('🔴 [EditProfile] Component UNMOUNTING')
      }
    }
  }, [])

  // UI State
  const [profileImageUploaded, setProfileImageUploaded] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)

  // Current Image URLs (for edit mode previews)
  const [currentDogImageUrl, setCurrentDogImageUrl] = useState(null)
  const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState(null)

  // Dog Image Upload State
  const [dogImageURL, setDogImageURL] = useState(null)
  const [dogImageFile, setDogImageFile] = useState(null)
  const [isDogImageUploading, setIsDogImageUploading] = useState(false)
  const [isDogImageUploaded, setIsDogImageUploaded] = useState(false)
  const [dogImageError, setDogImageError] = useState(null)
  const [dogBreeds, setDogBreeds] = useState([])

  // Profile Image Upload State
  const [isProfileImageUploading, setIsProfileImageUploading] = useState(false)

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aboutError, setAboutError] = useState('')
  const [userAboutError, setUserAboutError] = useState('')

  // Form Data
  const [formData, setFormData] = useState({
    user_id: userId,
    dogs_name: '',
    age: '',
    show_meetup_type: false,
    meetup_type: '',
    meetup_interest: '',
    about: '',
    userAge: '',
    userAbout: '',
    current_user_search_radius: 10,
  })

  // Fetch existing profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileRes = await axiosInstance.get(
          '/api/auth/current-user-profile',
          {
            params: { userId },
          }
        )
        const data = profileRes.data.data
        setFormData(data)

        // Extract image URLs for preview (sanitize to prevent XSS)
        if (data.image) {
          const sanitizedDogImageUrl = sanitizeImageUrl(data.image, null)
          if (sanitizedDogImageUrl) {
            setCurrentDogImageUrl(sanitizedDogImageUrl)
          } else {
            if (import.meta.env.MODE === 'development') {
              console.warn('Failed to sanitize dog image URL from API response')
            }
          }
        }
        if (data.profile_image) {
          const sanitizedProfileImageUrl = sanitizeImageUrl(
            data.profile_image,
            null
          )
          if (sanitizedProfileImageUrl) {
            setCurrentProfileImageUrl(sanitizedProfileImageUrl)
          } else {
            if (import.meta.env.MODE === 'development') {
              console.warn(
                'Failed to sanitize profile image URL from API response'
              )
            }
          }
        }
      } catch (err) {
        setError(
          sanitizeErrorMessage(
            err.response?.data?.message ||
              'Failed to load profile. Please try again.'
          )
        )
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId])

  // Dog Image Upload Handlers
  const handleDogImageSelect = (file) => {
    if (file) {
      const url = URL.createObjectURL(file)
      setDogImageURL(url)
      setDogImageFile(file)
      setDogImageError(null)
    }
  }

  const handleDogImageUpload = async () => {
    if (!dogImageFile) {
      setDogImageError('Please select an image first')
      throw new Error('No image file selected')
    }

    setIsDogImageUploading(true)
    setDogImageError(null)

    try {
      const form = new FormData()
      form.append('image', dogImageFile)

      // SECURITY FIX: Authorization occurs via JWT token (sent automatically by axiosInstance)
      // FormData text fields are not automatically parsed by multer, so we rely on JWT authentication
      // Don't set Content-Type header manually - let axios set it with proper boundary
      // Setting 'multipart/form-data' without boundary breaks multipart parsing on server
      const response = await axiosInstance.put('/api/auth/image', form)

      // Image uploaded successfully
      if (response.data?.data?.dogBreeds) {
        setDogBreeds(response.data.data.dogBreeds)
        setIsDogImageUploaded(true)
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload dog image. Please try again.'
      setDogImageError(sanitizeErrorMessage(errorMessage))
      setDogBreeds([])
      setIsDogImageUploaded(false)
      throw new Error(errorMessage)
    } finally {
      setIsDogImageUploading(false)
    }
  }

  const clearDogImage = () => {
    setDogImageURL(null)
    setDogImageFile(null)
    setDogImageError(null)
    setDogBreeds([])
    setIsDogImageUploaded(false)
  }

  // Form Validation
  const validateAboutField = (value) => {
    if (typeof value === 'string' && value.length > 26) {
      setAboutError('About your dog must be 26 characters or fewer.')
      return false
    } else {
      setAboutError('')
      return true
    }
  }

  const validateUserAboutField = () => {
    setUserAboutError('')
    return true
  }

  // Form Change Handler
  const handleChange = (e) => {
    const name = e.target.name
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value

    // Apply sentence case formatting to text fields
    if (
      e.target.type === 'text' &&
      ['dogs_name', 'about', 'userAbout'].includes(name)
    ) {
      value = formatSentenceCase(value)
    }

    // Validate about field length (max 26 characters)
    if (name === 'about') {
      validateAboutField(value)
    }

    // Validate userAbout field (unlimited)
    if (name === 'userAbout') {
      validateUserAboutField(value)
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  // Form Submission
  const submitProfile = async (e) => {
    e.preventDefault()

    // Block submit if About exceeds 26 chars
    if (!validateAboutField(formData.about)) {
      return
    }

    // Validate userAbout field
    if (!validateUserAboutField(formData.userAbout)) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      if (import.meta.env.MODE === 'development') {
        console.log('📝 [EditProfile] Submitting form with data:', {
          dogs_name: formData.dogs_name,
          about: formData.about,
          userAbout: formData.userAbout,
        })
      }

      const response = await axiosInstance.patch('/api/auth/user', {
        formData,
      })

      if (import.meta.env.MODE === 'development') {
        console.log('✅ [EditProfile] Backend response:', {
          status: response.status,
          data: response.data,
          modifiedCount: response.data?.modifiedCount,
          matchedCount: response.data?.matchedCount,
        })
      }

      const success = response.status === 200
      if (success) {
        // Check if data was actually modified
        if (response.data?.modifiedCount === 0) {
          if (import.meta.env.MODE === 'development') {
            console.warn(
              "⚠️ [EditProfile] No documents were modified! Response was 200 but DB wasn't updated."
            )
          }
          setError(
            'Profile appears unchanged. Please verify your changes and try again.'
          )
          setIsLoading(false)
          return
        }

        trackDogProfileUpdated()
        if (import.meta.env.MODE === 'development') {
          console.log('🚀 [EditProfile] About to call navigate()...')
        }
        navigate('/dashboard')
        if (import.meta.env.MODE === 'development') {
          console.log('🚀 [EditProfile] navigate() called')
        }

        // Refresh auth state in background to update profile image and other user data
        // This ensures Header and Chat components display the new profile image
        // Don't await this - let it happen after navigation to avoid race conditions
        if (import.meta.env.MODE === 'development') {
          console.log('🔄 [EditProfile] Refreshing auth state in background...')
        }
        checkAuth()
          .then(() => {
            if (import.meta.env.MODE === 'development') {
              console.log('✅ [EditProfile] Auth state refreshed in background')
            }
          })
          .catch((err) => {
            if (import.meta.env.MODE === 'development') {
              console.error('❌ [EditProfile] Auth refresh failed:', err)
            }
          })
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('❌ [EditProfile] Profile update error:', {
          message: err.message,
          status: err.response?.status,
        })
      }
      // Provide detailed error info for debugging double-submit issues
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to update profile. Please try again.'
      setError(sanitizeErrorMessage(errorMessage))
      console.error('❌ [EditProfile] Profile update error:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        errors: err.response?.data?.errors,
        fullError: err,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Button State
  // Block submission if:
  // 1. Form is currently being submitted
  // 2. Dog image hasn't been uploaded if a new one was selected (or no existing image)
  // 3. Any image is currently uploading (prevents race conditions with concurrent uploads)
  // 4. Form has validation errors
  // 5. Profile image was selected but not uploaded
  const isSubmitDisabled =
    isLoading ||
    (dogImageURL !== null && !isDogImageUploaded) ||
    (!dogImageURL && !currentDogImageUrl) ||
    isDogImageUploading ||
    isProfileImageUploading ||
    aboutError.length > 0 ||
    userAboutError.length > 0 ||
    (imageSelected && !profileImageUploaded)

  return (
    <>
      <PageHead
        title="Edit Dog Profile"
        description="Update your dog's profile information on Woof Meetup."
      />
      <div className="background-color">
        <div className="onboarding overlay-onboarding" aria-hidden="true">
          <Nav minimal={true} setShowModal={() => {}} showModal={false} />

          <div
            className="auth-modal onboarding"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dog-profile-heading"
          >
            <h2
              id="edit-dog-profile-heading"
              style={{
                textAlign: 'center',
                marginBottom: '5px',
                fontSize: '24px',
              }}
            >
              Edit Your Profile
            </h2>
            <Link
              style={{
                display: 'block',
                'margin-bottom': '1rem',
              }}
              to="/dashboard"
            >
              &lt;&lt; Back to Dashboard
            </Link>

            <OnboardingForm
              formData={formData}
              handleChange={handleChange}
              submitProfile={submitProfile}
              aboutError={aboutError}
              userAboutError={userAboutError}
              error={error}
              isLoading={isLoading}
              isSubmitDisabled={isSubmitDisabled}
              setProfileImageUploaded={setProfileImageUploaded}
              setImageSelected={setImageSelected}
              setIsProfileImageUploading={setIsProfileImageUploading}
              dogImageURL={dogImageURL}
              isDogImageUploading={isDogImageUploading}
              isProfileImageUploading={isProfileImageUploading}
              dogImageError={dogImageError}
              onDogImageSelect={handleDogImageSelect}
              onDogImageUpload={handleDogImageUpload}
              onClearDogImage={clearDogImage}
              dogBreeds={dogBreeds}
              currentDogImageUrl={currentDogImageUrl}
              currentProfileImageUrl={currentProfileImageUrl}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default EditDogProfile

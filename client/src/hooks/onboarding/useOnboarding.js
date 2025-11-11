import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../config/axiosInstance'
import { useAuthStore } from '../../store/useAuthStore'
import { formatSentenceCase } from '../../utilities/formatSentenceCase'

export const useOnboarding = () => {
  const { user, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  // UI State
  const [profileImageUploaded, setProfileImageUploaded] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)

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
    user_id: user?.user_id || '',
    dogs_name: '',
    age: '',
    show_meetup_type: false,
    meetup_type: 'Walk Companion',
    meetup_interest: 'Show all meetup activites',
    about: '',
    userAge: '',
    userAbout: '',
    matches: [],
    current_user_search_radius: 10,
  })

  // Update user_id in formData when user object changes
  useEffect(() => {
    if (user?.user_id) {
      setFormData((prevState) => ({
        ...prevState,
        user_id: user.user_id,
      }))
    }
  }, [user?.user_id])

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
      const formData = new FormData()
      formData.append('image', dogImageFile)

      // SECURITY FIX: Authorization occurs via JWT token (sent automatically by axiosInstance)
      // FormData text fields are not automatically parsed by multer, so we rely on JWT authentication
      // Don't set Content-Type header manually - let axios set it with proper boundary
      // Setting 'multipart/form-data' without boundary breaks multipart parsing on server
      const response = await axiosInstance.put('/api/auth/image', formData, {
        timeout: 60000, // 60 second timeout for image upload with AI processing
      })

      // Capture dog breeds from response
      if (response.data?.dogBreeds) {
        setDogBreeds(response.data.dogBreeds)
        setIsDogImageUploaded(true)
      } else {
        // If no breeds detected, it's likely not a dog image
        const errorMsg =
          'Could not detect a dog in this image. Please upload a dog photo.'
        setDogImageError(errorMsg)
        setDogBreeds([])
        throw new Error(errorMsg)
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to upload dog image. Please try again.'
      setDogImageError(errorMessage)
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
      setAboutError('About me must be 26 characters or fewer.')
      return false
    } else {
      setAboutError('')
      return true
    }
  }

  const validateUserAboutField = (value) => {
    if (typeof value === 'string' && value.length > 100) {
      setUserAboutError('About you must be 100 characters or fewer.')
      return false
    } else {
      setUserAboutError('')
      return true
    }
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

    // Validate userAbout field length (max 100 characters)
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

    // Block submit if userAbout exceeds 100 chars
    if (!validateUserAboutField(formData.userAbout)) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await axiosInstance.put('/api/auth/user', {
        formData,
      })
      const success = response.status === 200
      if (success) {
        // Navigate immediately to dashboard
        navigate('/dashboard')

        // Refresh auth state in background to update profile image and dog image URLs
        // This ensures Header and Chat components display the new images immediately
        // The checkAuth endpoint generates signed CloudFront URLs (valid for 24 hours)
        // Don't await this - let it happen after navigation to avoid race conditions
        checkAuth().catch((err) => {
          console.error('❌ [Onboarding] Auth refresh failed:', err)
        })
      }
    } catch (err) {
      setError('Failed to add profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Button State
  // Block submission if:
  // 1. Form is currently being submitted
  // 2. Dog image hasn't been uploaded yet (required for new profiles)
  // 3. Any image is currently uploading (prevents race conditions with concurrent uploads)
  // 4. Form has validation errors
  // 5. Profile image was selected but not uploaded (if optional fields are required)
  const isSubmitDisabled =
    isLoading ||
    !isDogImageUploaded ||
    isDogImageUploading ||
    isProfileImageUploading ||
    aboutError.length > 0 ||
    userAboutError.length > 0 ||
    (imageSelected && !profileImageUploaded)

  return {
    // State
    profileImageUploaded,
    imageSelected,
    isLoading,
    error,
    aboutError,
    userAboutError,
    formData,
    isSubmitDisabled,
    dogImageURL,
    dogImageFile,
    isDogImageUploading,
    isDogImageUploaded,
    dogImageError,
    dogBreeds,
    isProfileImageUploading,
    setIsProfileImageUploading,

    // Actions
    setProfileImageUploaded,
    setImageSelected,
    handleChange,
    submitProfile,
    handleDogImageSelect,
    handleDogImageUpload,
    clearDogImage,
  }
}

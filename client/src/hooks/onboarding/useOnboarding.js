import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import axios from 'axios'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

export const useOnboarding = () => {
  const [cookies] = useCookies(null)
  const navigate = useNavigate()

  // UI State
  const [showSecondButton, setShowSecondButton] = useState(false)
  const [hideImageUpload, setHideImageUpload] = useState(false)
  const [profileImageUploaded, setProfileImageUploaded] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)

  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aboutError, setAboutError] = useState('')

  // Form Data
  const [formData, setFormData] = useState({
    user_id: cookies.UserId,
    dogs_name: '',
    age: '',
    show_meetup_type: false,
    meetup_type: 'Walk Companion',
    meetup_interest: 'Show all meetup activites',
    about: '',
    matches: [],
    current_user_search_radius: 10,
  })

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

  // Form Change Handler
  const handleChange = (e) => {
    const name = e.target.name
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value

    // Validate about field length (max 26 characters)
    if (name === 'about') {
      validateAboutField(value)
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

    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.put(`${API_URL}/user`, {
        formData,
      })
      const success = response.status === 200
      if (success) navigate('/dashboard')
    } catch (err) {
      console.log(err)
      setError('Failed to add profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit Button State
  const isSubmitDisabled =
    isLoading ||
    aboutError.length > 0 ||
    (imageSelected && !profileImageUploaded)

  return {
    // State
    showSecondButton,
    hideImageUpload,
    profileImageUploaded,
    imageSelected,
    isLoading,
    error,
    aboutError,
    formData,
    isSubmitDisabled,

    // Actions
    setShowSecondButton,
    setHideImageUpload,
    setProfileImageUploaded,
    setImageSelected,
    handleChange,
    submitProfile,
  }
}

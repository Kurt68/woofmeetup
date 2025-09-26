import { useState, useRef, useCallback, useEffect } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import { Upload, X, Check } from 'lucide-react'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const SimpleImageUpload = ({
  setShowSecondButton,
  setHideImageUpload,
  setImageUploaded,
  isUserPhoto = false,
}) => {
  const [cookies] = useCookies(null)
  const [file, setFile] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const fileInputRef = useRef()

  const handleImageUpload = useCallback(async () => {
    if (!file) {
      setUploadError('Please select an image first')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('UserId', cookies.UserId)
      formData.append('image', file)

      // Use different endpoint based on whether it's a user photo or dog photo
      const endpoint = isUserPhoto ? '/profile-image' : '/image'

      await axios.put(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadSuccess(true)
      if (setImageUploaded) setImageUploaded(true)

      // Auto-proceed to next step after successful upload (only for dog photos)
      if (!isUserPhoto) {
        setTimeout(() => {
          setShowSecondButton(true)
          setHideImageUpload(true)
        }, 1500)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [
    cookies.UserId,
    file,
    setShowSecondButton,
    setHideImageUpload,
    setImageUploaded,
    isUserPhoto,
  ])

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) {
      setFile(null)
      setImageURL(null)
      setUploadError(null)
      setUploadSuccess(false)
      return
    }

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setUploadError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setUploadError('Image size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setUploadError(null)
    setUploadSuccess(false)

    // Create client side image URL for preview
    const url = URL.createObjectURL(selectedFile)
    setImageURL(url)
  }, [])

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const removeImage = useCallback(() => {
    setFile(null)
    setImageURL(null)
    setUploadError(null)
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const proceedToNextStep = useCallback(() => {
    setShowSecondButton(true)
    setHideImageUpload(true)
  }, [setShowSecondButton, setHideImageUpload])

  // Cleanup image URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageURL) {
        URL.revokeObjectURL(imageURL)
      }
    }
  }, [imageURL])

  return (
    <div className={`simple-image-upload ${isUserPhoto ? 'user-photo' : ''}`}>
      <div className="upload-container">
        {!isUserPhoto && <h3>Upload Your Dog's Photo</h3>}
        <p className="upload-description">
          {isUserPhoto
            ? 'Choose a clear photo of yourself to help other dog owners recognize you during meetups.'
            : 'Choose a clear photo of your dog to help other dog owners recognize them during meetups.'}
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Upload Status Messages */}
        {isUploading && (
          <div className="upload-status uploading">
            <div className="spinner"></div>
            Uploading your photo...
          </div>
        )}

        {uploadSuccess && (
          <div className="upload-status success">
            <Check size={20} />
            Photo uploaded successfully!
          </div>
        )}

        {uploadError && (
          <div className="upload-status error">{uploadError}</div>
        )}

        {/* Image Preview */}
        {imageURL && (
          <div className="image-preview">
            <img
              src={imageURL}
              alt={isUserPhoto ? 'Profile preview' : 'Dog preview'}
            />
          </div>
        )}

        {/* Upload Actions */}
        <div className="upload-actions">
          {!imageURL ? (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="upload-button primary"
            >
              <Upload size={20} />
              Choose Photo
            </button>
          ) : (
            <div className="image-actions">
              {!uploadSuccess && (
                <>
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploading || !file}
                    className="upload-button primary"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isUploading}
                    className="upload-button secondary"
                  >
                    <X size={16} />
                    Remove
                  </button>
                </>
              )}

              {uploadSuccess && !isUserPhoto && (
                <button
                  type="button"
                  onClick={proceedToNextStep}
                  className="upload-button primary"
                >
                  Continue to Profile Setup
                </button>
              )}

              {uploadSuccess && isUserPhoto && (
                <div className="upload-status success">
                  <Check size={20} />
                  Profile photo uploaded successfully!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleImageUpload

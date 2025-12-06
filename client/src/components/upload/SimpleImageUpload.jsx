import { useState, useRef, useCallback, useEffect } from 'react'
import axiosInstance from '../../config/axiosInstance'
import { Upload, X, Check, Loader } from 'lucide-react'
import { sanitizeImageUrl, sanitizeErrorMessage } from '../../utilities/sanitizeUrl'

/**
 * SimpleImageUpload - User profile/avatar image upload with content moderation
 *
 * Handles uploading a profile/avatar image for the user with server-side validations:
 * - File type validation (image/* only)
 * - File size validation (max 10MB)
 * - Nudity detection via OpenAI Vision API
 *
 * Used in both creation (Onboarding) and edit (EditDogProfile) contexts.
 * Displays validation errors and nudity detection results to the user.
 *
 * Upload Flow:
 * 1. User selects image file
 * 2. Client-side validation: file type and size
 * 3. User clicks "Upload" → calls handleImageUpload()
 * 4. Server validates and runs nudity detection
 * 5. If rejected: error message displayed (e.g., "Image contains nudity")
 * 6. If approved: success message, setImageUploaded(true) called
 *
 * Edit Mode Behavior:
 * - If currentImageUrl is provided and showCurrentImage is true:
 *   - "Current Profile Photo" label displayed below image
 *   - Button changes to "Change Photo" instead of "Upload Photo"
 *   - Selecting new image hides current image
 *   - Clicking "Remove" reverts to showing current image
 *
 * API Endpoint: PUT /api/auth/profile-image (multipart/form-data)
 * - image (File)
 * - Authorization: JWT token in cookie (authentication via req.userId)
 *
 * Validation Errors from Server:
 * - Nudity detection: "Image contains nudity and cannot be used as a profile picture"
 * - File size: "Image size must be less than 10MB"
 * - Other validation: Custom server error messages
 *
 * @param {Object} props
 * @param {Function} props.setImageUploaded - (bool) => void - Called on successful upload
 * @param {Function} props.setImageSelected - (bool) => void - Called when image is selected/cleared
 * @param {Function} props.setIsUploading - (bool) => void - Called when upload starts/ends (for parent form state)
 * @param {string|null} props.currentImageUrl - Signed CloudFront URL of existing image (edit mode)
 * @param {boolean} props.showCurrentImage - Whether to display the current image (edit mode)
 */
const SimpleImageUpload = ({
  setImageUploaded,
  setImageSelected,
  setIsUploading: setParentIsUploading,
  currentImageUrl = null,
  showCurrentImage = false,
}) => {
  const [file, setFile] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showingCurrentImage, setShowingCurrentImage] = useState(false)

  const fileInputRef = useRef()

  const handleImageUpload = useCallback(async () => {
    if (!file) {
      setUploadError('Please select an image first')
      return
    }

    setIsUploading(true)
    if (setParentIsUploading) setParentIsUploading(true) // Notify parent form that upload is starting
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      // SECURITY FIX: Don't set Content-Type header manually - let axios set it with proper boundary
      // Setting 'multipart/form-data' without boundary breaks multipart parsing on server
      // NOTE: UserId is not sent in FormData because user is authenticated via JWT token (req.userId)
      // Multer doesn't parse text fields from multipart/form-data by default, so we rely on JWT auth instead
      await axiosInstance.put('/api/auth/profile-image', formData)

      setUploadSuccess(true)
      if (setImageUploaded) setImageUploaded(true)
      if (setImageSelected) setImageSelected(false) // Reset image selected state after successful upload
    } catch (error) {
      // Display server error message if available (includes nudity detection messages)
      const errorMessage =
        error.response?.data?.message || 'Failed to upload image. Please try again.'
      setUploadError(sanitizeErrorMessage(errorMessage))
    } finally {
      setIsUploading(false)
      if (setParentIsUploading) setParentIsUploading(false) // Notify parent form that upload is complete
    }
  }, [file, setImageSelected, setImageUploaded, setParentIsUploading])

  const handleFileSelect = useCallback(
    (e) => {
      const selectedFile = e.target.files[0]

      if (!selectedFile) {
        setFile(null)
        setImageURL(null)
        setUploadError(null)
        setUploadSuccess(false)
        setShowingCurrentImage(currentImageUrl !== null && showCurrentImage)
        if (setImageSelected) setImageSelected(false)
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
      setShowingCurrentImage(false)
      if (setImageSelected) setImageSelected(true)

      // Create client side image URL for preview
      const url = URL.createObjectURL(selectedFile)
      setImageURL(url)
    },
    [currentImageUrl, showCurrentImage, setImageSelected]
  )

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const removeImage = useCallback(() => {
    setFile(null)
    setImageURL(null)
    setUploadError(null)
    setUploadSuccess(false)
    setShowingCurrentImage(currentImageUrl !== null && showCurrentImage)
    if (setImageSelected) setImageSelected(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [currentImageUrl, showCurrentImage, setImageSelected])

  // Sync showingCurrentImage state when props change
  useEffect(() => {
    if (!imageURL) {
      if (currentImageUrl && showCurrentImage) {
        setShowingCurrentImage(true)
      } else if (!currentImageUrl || !showCurrentImage) {
        setShowingCurrentImage(false)
      }
    }
  }, [currentImageUrl, showCurrentImage, imageURL])

  // Cleanup image URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageURL) {
        URL.revokeObjectURL(imageURL)
      }
    }
  }, [imageURL])

  return (
    <div className="simple-image-upload user-photo">
      <label>
        <strong>Upload Your Profile Photo</strong>
      </label>
      <p className="upload-description">
        (Optional) Choose a clear photo of yourself to help other dog owners recognize you during
        meetups.
      </p>
      <div className="upload-container">
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
            <Loader className="spin" size={18} />
            Uploading your photo
          </div>
        )}

        {uploadError && (
          <div className="upload-status error">{sanitizeErrorMessage(uploadError)}</div>
        )}

        {/* Image Preview */}
        {(imageURL || showingCurrentImage) && (
          <div className="image-preview">
            <img
              src={sanitizeImageUrl(imageURL || currentImageUrl, '/spinner.svg')}
              alt="Profile preview"
            />
          </div>
        )}

        {/* Upload Success Message (before buttons) */}
        {uploadSuccess && (
          <div className="upload-status success">
            <Check size={20} />
            Profile photo uploaded successfully!
          </div>
        )}

        {/* Upload Actions */}
        <div className="upload-actions">
          {!imageURL && !showingCurrentImage ? (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="upload-button primary"
            >
              <Upload size={20} />
              Choose Photo
            </button>
          ) : showingCurrentImage && !imageURL ? (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="upload-button primary"
            >
              <Upload size={20} />
              Change Photo
            </button>
          ) : (
            <div className="image-actions">
              {!uploadSuccess && (
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={isUploading || !file}
                  className={`upload-button primary ${!isUploading && file ? 'bouncing' : ''}`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              )}

              <button
                type="button"
                onClick={removeImage}
                disabled={isUploading}
                className="upload-button secondary"
              >
                <X size={16} />
                {uploadSuccess ? 'Change Photo' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleImageUpload

import { useRef, useCallback, useState, useEffect } from 'react'
import { Upload, X, Loader, Check } from 'lucide-react'
import {
  sanitizeImageUrl,
  sanitizeErrorMessage,
} from '../../utilities/sanitizeUrl'

/**
 * DogImageUploadSection - Dog photo upload with ML breed detection
 *
 * Handles uploading a dog photo and displays detected dog breeds with confidence scores.
 * Supports both creation (no current image) and edit (with existing image preview) modes.
 *
 * Upload Flow:
 * 1. User selects image → triggers onImageSelect(file)
 * 2. Blob URL created for preview
 * 3. User clicks "Upload Photo" → triggers onUpload()
 * 4. Backend processes image through ML model
 * 5. Response includes dogBreeds array with breed names and probabilities
 * 6. Breeds displayed with confidence percentages
 *
 * Edit Mode Behavior:
 * - If currentImageUrl is provided and showCurrentImage is true:
 *   - "Current Dog Photo" label displayed below image
 *   - Button changes to "Change Photo" instead of "Choose Photo"
 *   - Selecting new image hides current image
 *   - Clicking "Remove" reverts to showing current image
 *
 * API Endpoint: PUT /api/auth/image (multipart/form-data)
 * - Authorization: JWT token (sent automatically by axiosInstance)
 * - image (File)
 *
 * Response includes:
 * - message: success message
 * - dogBreeds: Array<{className: string, probability: number}>
 *
 * @param {Object} props
 * @param {string|null} props.imageURL - Blob URL of newly selected image (null if not selected)
 * @param {boolean} props.isUploading - Upload operation in progress
 * @param {string|null} props.error - Upload error message
 * @param {Function} props.onImageSelect - (file: File) => void - Called when user selects image
 * @param {Function} props.onUpload - () => Promise<void> - Called when user clicks upload button
 * @param {Function} props.onClear - () => void - Called when user clicks remove/clear button
 * @param {Array} props.dogBreeds - Detected breeds [{className, probability}, ...]
 * @param {string|null} props.currentImageUrl - Signed CloudFront URL of existing image (edit mode)
 * @param {boolean} props.showCurrentImage - Whether to display the current image (edit mode)
 */
const DogImageUploadSection = ({
  imageURL,
  isUploading,
  error,
  onImageSelect,
  onUpload,
  onClear,
  dogBreeds = [],
  currentImageUrl = null,
  showCurrentImage = false,
}) => {
  const fileInputRef = useRef()
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showingCurrentImage, setShowingCurrentImage] = useState(false)

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (file) {
        setShowingCurrentImage(false)
        onImageSelect(file)
      } else {
        setShowingCurrentImage(currentImageUrl !== null && showCurrentImage)
      }
    },
    [onImageSelect, currentImageUrl, showCurrentImage]
  )

  const triggerFileSelect = useCallback(() => {
    setUploadSuccess(false)
    fileInputRef.current?.click()
  }, [])

  const handleUploadWithSuccess = useCallback(async () => {
    try {
      await onUpload()
      // Set success state after successful upload
      setUploadSuccess(true)
    } catch (err) {
      // Error is handled by onUpload, we just don't show success
      setUploadSuccess(false)
    }
  }, [onUpload])

  const handleClearWithReset = useCallback(() => {
    setUploadSuccess(false)
    setShowingCurrentImage(currentImageUrl !== null && showCurrentImage)
    onClear()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onClear, currentImageUrl, showCurrentImage])

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

  return (
    <div className="simple-image-upload dog-photo">
      <label>
        <strong>Upload Your Dog's Photo</strong>
        <br />
        <br />
      </label>

      <div className="upload-container">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Loading status */}
        {isUploading && (
          <div className="upload-status uploading">
            <Loader className="spin" size={18} />
            Analyzing your dog image...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="upload-status error" role="alert">
            {sanitizeErrorMessage(error)}
          </div>
        )}

        {/* Missing current image notice (edit mode) */}
        {!imageURL && !showingCurrentImage && showCurrentImage && (
          <div className="upload-status warning" role="status">
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              Previous dog photo not available. Please upload a new photo or
              select an existing one.
            </p>
          </div>
        )}

        {/* Image Preview with Breed List */}
        {(imageURL || showingCurrentImage) && (
          <div className="image-preview dog-preview">
            <img
              src={sanitizeImageUrl(
                imageURL || currentImageUrl,
                '/spinner.svg'
              )}
              alt="Dog preview for breed detection"
              loading="lazy"
              decoding="async"
            />

            {/* Breed List */}
            {dogBreeds.length > 0 && (
              <div className="breed-list">
                <h4 className="breed-list-title">Detected Breeds</h4>
                <ul className="breed-items">
                  {dogBreeds.map((breed, index) => (
                    <li key={index} className="breed-item">
                      <span className="breed-name">
                        {breed.className.replace(/_/g, ' ')}
                      </span>
                      <span className="breed-probability">
                        {(breed.probability * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Success Message (before buttons) */}
        {uploadSuccess && (
          <div className="upload-status success">
            <Check size={20} />
            Dog photo uploaded successfully!
          </div>
        )}

        {/* Upload Actions */}
        <div className="upload-actions">
          {!imageURL && !showingCurrentImage && !error ? (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="upload-button primary"
            >
              <Upload size={20} />
              Choose Photo
            </button>
          ) : !imageURL && showingCurrentImage ? (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="upload-button primary"
            >
              <Upload size={20} />
              Change Photo
            </button>
          ) : imageURL ? (
            <div className="image-actions">
              {!uploadSuccess && (
                <button
                  type="button"
                  onClick={handleUploadWithSuccess}
                  disabled={isUploading}
                  className={`upload-button primary ${
                    !isUploading ? 'bouncing' : ''
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              )}

              <button
                type="button"
                onClick={handleClearWithReset}
                disabled={isUploading}
                className="upload-button secondary"
              >
                <X size={16} />
                {uploadSuccess ? 'Upload Different Photo' : 'Remove'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default DogImageUploadSection

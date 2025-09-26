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

      await axios.put(`${API_URL}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadSuccess(true)
      if (setImageUploaded) setImageUploaded(true)

      // Auto-proceed to next step after successful upload
      setTimeout(() => {
        setShowSecondButton(true)
        setHideImageUpload(true)
      }, 1500)
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
    <div className="simple-image-upload">
      <div className="upload-container">
        <h3>Upload Your Dog's Photo</h3>
        <p className="upload-description">
          Choose a clear photo of your dog to help other dog owners recognize
          them during meetups.
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
              alt="Dog preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
              }}
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

              {uploadSuccess && (
                <button
                  type="button"
                  onClick={proceedToNextStep}
                  className="upload-button primary"
                >
                  Continue to Profile Setup
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .simple-image-upload {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .upload-container {
          text-align: center;
        }

        .upload-container h3 {
          margin-bottom: 10px;
          color: #374151;
        }

        .upload-description {
          color: #6b7280;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .upload-status {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .upload-status.uploading {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .upload-status.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #34d399;
        }

        .upload-status.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #f87171;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #fcd34d;
          border-top: 2px solid #92400e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .image-preview {
          margin: 20px 0;
          padding: 10px;
          background-color: #f9fafb;
          border-radius: 8px;
        }

        .upload-actions {
          margin-top: 20px;
        }

        .image-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .upload-button {
          padding: 12px 24px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          min-width: 120px;
          justify-content: center;
        }

        .upload-button.primary {
          background-color: #3b82f6;
          color: white;
        }

        .upload-button.primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .upload-button.secondary {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .upload-button.secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .image-actions {
            flex-direction: column;
            align-items: center;
          }

          .upload-button {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  )
}

export default SimpleImageUpload

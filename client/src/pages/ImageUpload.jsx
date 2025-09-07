import { useState, useRef, useEffect } from 'react'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'  // Import WebGL backend
import '@tensorflow/tfjs-backend-cpu'    // Import CPU backend as fallback


const DogDetector = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDog, setIsDog] = useState(null)
  const [dogBreed, setDogBreed] = useState(null)
  const [confidence, setConfidence] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [modelStatus, setModelStatus] = useState('Not loaded')
  const [error, setError] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const fileInputRef = useRef(null)
  const imageRef = useRef(null)
  const modelRef = useRef(null)

  useEffect(() => {
    loadOrCreateModel()
  }, [])

const loadOrCreateModel = async () => {
  try {
    setModelStatus('Setting up TensorFlow.js...')
    
    // First, try to use WebGL backend (faster)
    try {
      await tf.setBackend('webgl')
      console.log('Using WebGL backend')
    } catch (e) {
      console.warn('WebGL backend failed, falling back to CPU:', e)
      // Fall back to CPU if WebGL is not available
      await tf.setBackend('cpu')
      console.log('Using CPU backend')
    }
    
    setModelStatus('Loading MobileNet model...')

    // Load the pre-trained MobileNet model
    const model = await mobilenet.load()

    modelRef.current = model
    setModelStatus('MobileNet model loaded successfully')
  } catch (error) {
    console.error('Model loading error:', error)
    setError('Failed to load model: ' + error.message)
    setModelStatus('Error loading model')
  }
}

  // List of dog breeds that MobileNet can identify
  const dogBreeds = [
    'affenpinscher',
    'afghan hound',
    'airedale',
    'akita',
    'alaskan malamute',
    'american staffordshire terrier',
    'australian cattle dog',
    'australian shepherd',
    'australian terrier',
    'basenji',
    'basset',
    'beagle',
    'bearded collie',
    'bedlington terrier',
    'bernese mountain dog',
    'bichon frise',
    'bloodhound',
    'bluetick',
    'border collie',
    'border terrier',
    'borzoi',
    'boston bull',
    'bouvier des flandres',
    'boxer',
    'brabancon griffon',
    'briard',
    'brittany spaniel',
    'bull mastiff',
    'cairn',
    'cardigan',
    'chesapeake bay retriever',
    'chihuahua',
    'chow',
    'clumber',
    'cocker spaniel',
    'collie',
    'curly-coated retriever',
    'dachshund',
    'dalmatian',
    'dandie dinmont',
    'dingo',
    'doberman',
    'english foxhound',
    'english setter',
    'english springer',
    'entlebucher',
    'eskimo dog',
    'flat-coated retriever',
    'french bulldog',
    'german shepherd',
    'german short-haired pointer',
    'giant schnauzer',
    'golden retriever',
    'gordon setter',
    'great dane',
    'great pyrenees',
    'greater swiss mountain dog',
    'greyhound',
    'groenendael',
    'ibizan hound',
    'irish setter',
    'irish terrier',
    'irish water spaniel',
    'irish wolfhound',
    'italian greyhound',
    'japanese spaniel',
    'keeshond',
    'kelpie',
    'kerry blue terrier',
    'komondor',
    'kuvasz',
    'labrador retriever',
    'lakeland terrier',
    'leonberg',
    'lhasa',
    'malamute',
    'malinois',
    'maltese dog',
    'mexican hairless',
    'miniature pinscher',
    'miniature poodle',
    'miniature schnauzer',
    'newfoundland',
    'norfolk terrier',
    'norwegian elkhound',
    'norwich terrier',
    'old english sheepdog',
    'otterhound',
    'papillon',
    'pekinese',
    'pembroke',
    'pomeranian',
    'poodle',
    'pug',
    'redbone',
    'rhodesian ridgeback',
    'rottweiler',
    'saint bernard',
    'saluki',
    'samoyed',
    'schipperke',
    'scotch terrier',
    'scottish deerhound',
    'sealyham terrier',
    'shetland sheepdog',
    'shih-tzu',
    'siberian husky',
    'silky terrier',
    'soft-coated wheaten terrier',
    'staffordshire bullterrier',
    'standard poodle',
    'standard schnauzer',
    'sussex spaniel',
    'tibetan mastiff',
    'tibetan terrier',
    'toy poodle',
    'toy terrier',
    'vizsla',
    'walker hound',
    'weimaraner',
    'welsh springer spaniel',
    'west highland white terrier',
    'whippet',
    'wire-haired fox terrier',
    'yorkshire terrier',
  ]

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)')
      return
    }

    console.log('File selected:', file.name, file.type, file.size)

    // Reset states
    setSelectedImage(file)
    setIsDog(null)
    setDogBreed(null)
    setConfidence(null)
    setError(null)
    setImageLoaded(false)
    setPreviewUrl(null)

    // Use FileReader to create data URL instead of blob URL
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('File converted to data URL')
      setPreviewUrl(e.target.result)
    }
    reader.onerror = (e) => {
      console.error('FileReader error:', e)
      setError('Failed to read the selected image file.')
    }
    reader.readAsDataURL(file)
  }

  const handleImageLoad = () => {
    console.log('Image loaded successfully')
    setImageLoaded(true)
  }

  const handleImageError = (e) => {
    console.error('Image load error:', e)
    setError(`Failed to load image: ${e.target?.src || 'Unknown source'}`)
    setImageLoaded(false)
  }

  const detectDog = async () => {
    if (
      !selectedImage ||
      !modelRef.current ||
      !imageRef.current ||
      !imageLoaded
    ) {
      setError('Please wait for the image to load completely before detecting.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Add a small delay to ensure image is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Check if image is actually loaded and accessible
      if (imageRef.current.naturalWidth === 0) {
        throw new Error('Image failed to load properly')
      }

      // Use MobileNet to classify the image
      const predictions = await modelRef.current.classify(imageRef.current)

      // Check if any of the top predictions are dog breeds
      let dogFound = false
      let bestDogMatch = null
      let bestConfidence = 0

      for (const prediction of predictions) {
        const className = prediction.className.toLowerCase()

        // Check if this prediction matches any known dog breed
        const isDogBreed = dogBreeds.some(
          (breed) =>
            className.includes(breed) || breed.includes(className.split(',')[0])
        )

        if (isDogBreed && prediction.probability > bestConfidence) {
          dogFound = true
          bestDogMatch = prediction.className
          bestConfidence = prediction.probability
        }
      }

      setIsDog(dogFound)
      if (dogFound) {
        setDogBreed(bestDogMatch)
        setConfidence(bestConfidence)
      } else {
        setDogBreed(null)
        setConfidence(null)
      }
    } catch (error) {
      setError('Detection failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetUpload = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    setIsDog(null)
    setDogBreed(null)
    setConfidence(null)
    setError(null)
    setImageLoaded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <style>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 32px;
        }

        .title {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            color: #374151;
            margin-bottom: 32px;
        }

        .status-box {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .status-text {
            font-size: 0.875rem;
            color: #6b7280;
        }

        .upload-section {
            margin-bottom: 32px;
        }

        .upload-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 12px;
        }

        .file-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            background: white;
            cursor: pointer;
        }

        .file-input:hover {
            border-color: #d1d5db;
        }

        .preview-container {
            border: 2px solid #d1d5db;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
        }

        .preview-image {
            max-width: 100%;
            height: 300px;
            object-fit: contain;
            margin: 0 auto;
            border-radius: 8px;
            display: block;
        }

        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 300px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }

        .loading-content {
            text-align: center;
        }

        .spinner {
            width: 32px;
            height: 32px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            color: #6b7280;
            font-size: 0.875rem;
        }

        .button-container {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-top: 24px;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .btn-primary {
            background-color: #2563eb;
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background-color: #1d4ed8;
        }

        .btn-primary:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }

        .btn-secondary {
            background-color: #6b7280;
            color: white;
        }

        .btn-secondary:hover {
            background-color: #4b5563;
        }

        .error-box {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .results-container {
            background-color: #f9fafb;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 24px;
        }

        .results-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .detection-result {
            margin-bottom: 16px;
        }

        .result-label {
            font-weight: 500;
        }

        .result-yes {
            color: #16a34a;
            font-size: 1.125rem;
        }

        .result-no {
            color: #dc2626;
            font-size: 1.125rem;
        }

        .info-box {
            padding: 16px;
            border-radius: 8px;
            margin-top: 16px;
        }

        .info-box.success {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #15803d;
        }

        .info-box.warning {
            background-color: #fffbeb;
            border: 1px solid #fed7aa;
            color: #d97706;
        }

        .info-text {
            font-size: 0.875rem;
        }

        {/* .note {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 32px;
            line-height: 1.5;
        } */}

        .hidden {
            display: none;
        }
      `}</style>

      <div className="container">
        <h1 className="title">🐕 Dog Detection</h1>

        <div className="status-box">
          <p className="status-text">
            <strong>Model Status:</strong> {modelStatus}
          </p>
        </div>

        <div className="upload-section">
          <label className="upload-label" htmlFor="fileInput">
            Upload an image to check if it contains a dog:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        {previewUrl && (
          <div className="preview-container">
            <img
              ref={imageRef}
              src={previewUrl}
              alt="Uploaded image preview"
              className="preview-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />

            {!imageLoaded && previewUrl && (
              <div className="loading-container">
                <div className="loading-content">
                  <div className="spinner"></div>
                  <div className="loading-text">Loading image...</div>
                </div>
              </div>
            )}

            <div className="button-container">
              <button
                onClick={detectDog}
                disabled={isLoading || !modelRef.current || !imageLoaded}
                className="btn btn-primary"
              >
                {isLoading ? 'Analyzing...' : 'Check if Dog'}
              </button>

              <button onClick={resetUpload} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {isDog !== null && (
          <div className="results-container">
            <h3 className="results-title">Detection Results:</h3>

            <div className="detection-result">
              <span className="result-label">Dog detected: </span>
              <span className={isDog ? 'result-yes' : 'result-no'}>
                {isDog
                  ? '✅ Yes - This is a dog!'
                  : '❌ No - This is not a dog'}
              </span>
            </div>

            {isDog && dogBreed && (
              <div className="detection-result">
                <span className="result-label">Breed identified: </span>
                <span className="result-yes">
                  <strong>{dogBreed}</strong>
                </span>
              </div>
            )}

            {isDog && confidence && (
              <div className="detection-result">
                <span className="result-label">Confidence: </span>
                <span className="result-yes">
                  {(confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {isDog === false && (
              <div className="info-box warning">
                <p className="info-text">
                  The image doesn't appear to contain a dog. The AI model
                  analyzed the image but couldn't identify any dog breeds. Try
                  uploading a different image with a clearer view of a dog.
                </p>
              </div>
            )}

            {/* {isDog === true && (
              <div className="info-box success">
                <p className="info-text">
                  <strong>Dog detected!</strong> The MobileNet model has
                  successfully identified a dog breed in the uploaded image
                  using real computer vision technology.
                </p>
              </div>
            )} */}
          </div>
        )}

 
      </div>
    </div>
  )
}

export default DogDetector

import { useState, useRef, lazy, Suspense } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import {
  preloadTensorFlow,
  getTensorFlowModules,
} from '../utilities/tensorflowPreloader'
import performanceMonitor from '../utilities/performanceMonitor'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

// Lazy load components to reduce initial bundle size
const MascotSVG = lazy(() => import('../components/MascotSVG'))

const ImageUpload = ({ setShowSecondButton, setHideImageUpload }) => {
  const [cookies] = useCookies(null)
  const [file, setFile] = useState()

  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [results, setResults] = useState([])
  const [submitPicture, setSubmitPicture] = useState(false)
  const [hideText, setHideText] = useState(false)
  const [dogBreeds, setDogBreeds] = useState([])
  const [modelLoadRequested, setModelLoadRequested] = useState(false)

  const imageRef = useRef()
  const fileInputRef = useRef()

  const submit = async (event) => {
    event.preventDefault()
    setShowSecondButton(true)
    setHideImageUpload(true)

    const formData = new FormData()
    formData.append('UserId', cookies.UserId)
    formData.append('image', file)

    await axios.put(`${API_URL}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  const fileSelected = (e) => {
    // s3 file
    const file = e.target.files[0]
    setFile(file)

    // create client side image url
    const { files } = e.target
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0])
      setImageURL(url)
    } else {
      setImageURL(null)
    }
  }

  const loadModel = async () => {
    setIsModelLoading(true)
    performanceMonitor.mark('tensorflow_model_load')

    try {
      console.log('Loading TensorFlow.js, MobileNet, and dog breeds...')

      // Use preloader to get modules
      const modules =
        (await getTensorFlowModules()) || (await preloadTensorFlow())
      const { tf, mobilenet, dogBreedsModule } = modules

      // Set dog breeds
      setDogBreeds(dogBreedsModule.default)

      console.log('Initializing TensorFlow.js backends...')

      // Initialize TensorFlow.js with WebGL backend, fallback to CPU
      await tf.ready()

      // Try to set WebGL backend, fallback to CPU if it fails
      try {
        await tf.setBackend('webgl')
        console.log('Using WebGL backend')
      } catch (webglError) {
        console.warn('WebGL backend failed, falling back to CPU:', webglError)
        await tf.setBackend('cpu')
        console.log('Using CPU backend')
      }

      console.log('Loading MobileNet model...')
      const model = await mobilenet.load()
      setModel(model)
      setIsModelLoading(false)
      performanceMonitor.measure('tensorflow_model_load')
      console.log('Model loaded successfully')
    } catch (error) {
      console.error('Failed to load model:', error)
      setIsModelLoading(false)
      performanceMonitor.measure('tensorflow_model_load')
    }
  }

  const identify = async () => {
    // Check if model is loaded
    if (!model) {
      console.error('Model not loaded yet')
      alert('AI model is still loading. Please wait a moment and try again.')
      return
    }

    // Check if image is available
    if (!imageRef.current) {
      console.error('Image not loaded yet')
      alert('Please wait for the image to load completely.')
      return
    }

    try {
      console.log('Classifying image...')
      performanceMonitor.mark('tensorflow_inference')
      const results = await model.classify(imageRef.current)
      performanceMonitor.measure('tensorflow_inference')
      console.log('Classification results:', results)
      setResults(results)
      setSubmitPicture(true)
    } catch (error) {
      console.error('Error during image classification:', error)
      performanceMonitor.measure('tensorflow_inference')
      alert('Error analyzing image. Please try again.')
    }
  }
  const dogFound = results.filter((dog) =>
    dogBreeds.includes(dog.className.toLowerCase())
  )

  const triggerUpload = () => {
    fileInputRef.current.click()
    setHideText(true)
    // Load model when user first interacts with upload
    if (!modelLoadRequested && !model) {
      setModelLoadRequested(true)
      loadModel()
    }
  }

  const handlePreload = () => {
    // Start preloading TensorFlow when user shows intent (hover/focus)
    if (!modelLoadRequested && !model) {
      preloadTensorFlow().catch(console.error)
    }
  }

  // Remove automatic model loading on mount
  // Model will load when user first uploads an image

  return (
    <>
      <Suspense fallback={<div className="mascot-loading">Loading...</div>}>
        <MascotSVG />
      </Suspense>
      <div className="image-identification">
        {/* Model Loading Status */}
        {isModelLoading && (
          <div className="model-loading-alert">
            Loading AI Model... Please wait, this may take a moment.
          </div>
        )}

        {/* Model Ready Status */}
        {!isModelLoading && model && (
          <div className="model-ready-alert">
            &#10003; Dog AI Model Ready - You can now upload and analyze images!
          </div>
        )}

        <input
          id="dogs-picture"
          onChange={fileSelected}
          type="file"
          accept="image/*"
          capture="camera"
          className="uploadInput"
          ref={fileInputRef}
        />

        <section>
          {!hideText && (
            <label htmlFor="dogs-picture">
              <div className="instructions">
                <p>
                  &#10003; AI checks an image to match a breed. Mixed breed it
                  guesses but knows it&apos;s a dog.
                </p>

                <p>&#10003; Head shot & nothing in its mouth works best.</p>

                <p>&#10003; Portrait pics work best too!</p>

                <p>
                  &#10003; To convert native .heic image format imported from
                  your phone on a mac open the HEIC file in the Preview app, go
                  to File &gt; Export, select JPEG as the format, and save the
                  file for upload.
                </p>

                <p>
                  &#10003; To convert .heic to JPEG on an iPhone, navigate to
                  the HEIC photo you wish to convert and select it. Then, use
                  the ‘Share’ button and opt to copy it. The photo auto converts
                  to JPEG. Paste the file to a folder on your phone for upload.
                </p>
              </div>
            </label>
          )}
          {!dogFound?.length && (
            <button
              className="uploadImage"
              onClick={triggerUpload}
              onMouseEnter={handlePreload}
              onFocus={handlePreload}
            >
              Upload Image
            </button>
          )}

          {dogFound.length === 0 && (
            <div className="resultsHolder">
              <div className="result">
                <span className="confidence"></span>
              </div>
            </div>
          )}
          {imageURL && (
            <>
              <button
                onClick={identify}
                className="button"
                disabled={!model || isModelLoading}
                style={{
                  backgroundColor: !model || isModelLoading ? '#9ca3af' : '',
                  cursor: !model || isModelLoading ? 'not-allowed' : 'pointer',
                  opacity: !model || isModelLoading ? 0.6 : 1,
                }}
              >
                {isModelLoading
                  ? 'Loading AI model...'
                  : !model
                  ? 'AI model not ready'
                  : 'Please identify image'}
              </button>
            </>
          )}

          {submitPicture && dogFound.length > 0 && (
            <form className="image-submit" onSubmit={submit}>
              <button className="edit-button" type="submit">
                Submit your dog!
              </button>
            </form>
          )}
          {dogFound.length > 0 && (
            <div className="resultsHolder">
              {dogFound.map((dog, index) => (
                <div className="result" key={dog.className}>
                  <span className="name">
                    <strong>{dog.className}</strong>{' '}
                  </span>
                  <span className="confidence">
                    Confidence level:{' '}
                    <span>{(dog.probability * 100).toFixed(2)}%</span>
                    {index === 0 && (
                      <>
                        <hr />
                        <span className="bestGuess">Best Guess</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="imageHolder">
          {imageURL && (
            <img
              src={imageURL}
              alt="Upload Preview"
              crossOrigin="anonymous"
              ref={imageRef}
            />
          )}
        </div>
      </div>
    </>
  )
}
export default ImageUpload

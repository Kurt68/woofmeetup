import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

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
    try {
      console.log('Loading TensorFlow.js, MobileNet, and dog breeds...')

      // Dynamically import TensorFlow.js, MobileNet, and dog breeds
      const [tf, mobilenet, dogBreedsModule] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet'),
        import('../data/dogBreeds.json'),
      ])

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
      console.log('Model loaded successfully')
    } catch (error) {
      console.error('Failed to load model:', error)
      setIsModelLoading(false)
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
      const results = await model.classify(imageRef.current)
      console.log('Classification results:', results)
      setResults(results)
      setSubmitPicture(true)
    } catch (error) {
      console.error('Error during image classification:', error)
      alert('Error analyzing image. Please try again.')
    }
  }
  const dogFound = results.filter((dog) =>
    dogBreeds.includes(dog.className.toLowerCase())
  )

  const triggerUpload = () => {
    fileInputRef.current.click()
    setHideText(true)
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <>
      <div className="mascot">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="145.374"
          height="126.629"
          viewBox="0 0 145.374 126.629"
        >
          <g
            id="Group_44"
            data-name="Group 44"
            transform="translate(-899.089 -2912.469)"
          >
            <g
              id="Group_43"
              data-name="Group 43"
              transform="translate(899.089 2912.469)"
            >
              <g id="Group_42" data-name="Group 42">
                <circle
                  id="Ellipse_6"
                  data-name="Ellipse 6"
                  cx="38.874"
                  cy="38.874"
                  r="38.874"
                  transform="matrix(0.999, 0.052, -0.052, 0.999, 35.652, 22.633)"
                  fill="#fff"
                />
                <path
                  id="Path_24"
                  data-name="Path 24"
                  d="M13.425,31.623c7.33-9.707,12.6-14.88,16.4-16.424A40.135,40.135,0,0,1,93.9,16.767a18.448,18.448,0,0,1,4.8,3.505,67.936,67.936,0,0,1,10.418,11.35c11.031,14.586,16.326,29.147,11.84,32.505-3.6,2.7-12.429-2.647-21.474-12.4a40.1,40.1,0,0,1-76.385.147C13.842,62.093,5.238,66.849,1.61,64.128-2.9,60.77,2.394,46.209,13.425,31.623ZM61.276,76.508a36.873,36.873,0,0,0,35.717-27.6c-.392-.441-.784-.907-1.152-1.373-7.869,5.27-21.915,5.418-27.97-1.986-7.869-9.634-.76-21.18,7.158-27.112a17.844,17.844,0,0,1,13.385-3.383,36.953,36.953,0,0,0-54.421.123,4.031,4.031,0,0,1,.539.343c4.511,3.334-.809,22.749-4.9,28.289-1.373,1.863-2.746,3.6-4.094,5.221A36.984,36.984,0,0,0,61.276,76.508ZM81.77,35.913a5.565,5.565,0,1,0-5.565,5.54A5.555,5.555,0,0,0,81.77,35.913Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 36.169, 0)"
                />
                <ellipse
                  id="Ellipse_1"
                  data-name="Ellipse 1"
                  cx="2.035"
                  cy="2.008"
                  rx="2.035"
                  ry="2.008"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 88.648, 62.748)"
                />
                <path
                  id="Path_25"
                  data-name="Path 25"
                  d="M6.094,0A6.068,6.068,0,1,1,0,6.067,6.084,6.084,0,0,1,6.094,0ZM7.464,5.772A1.718,1.718,0,1,0,5.718,4.054,1.772,1.772,0,0,0,7.464,5.772Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 58.585, 44.985)"
                  fill="#b1832d"
                />
                <path
                  id="Path_26"
                  data-name="Path 26"
                  d="M2.868,12.364a5.421,5.421,0,0,0,9.047-3.785V8.551c-1.879-1.1-4.645-3.114-4.645-5.423,0-3.517,2.738-3.114,6.282-3.114,3.517,0,6.5-.4,6.5,3.114,0,2.309-2.765,4.322-4.645,5.423h0a5.39,5.39,0,0,0,5.4,5.181,5.58,5.58,0,0,0,3.651-1.4,1.769,1.769,0,0,1,2.47.107,1.736,1.736,0,0,1-.107,2.443A8.8,8.8,0,0,1,20.828,17.2a8.9,8.9,0,0,1-7.141-3.571A8.922,8.922,0,0,1,.559,14.887a1.736,1.736,0,0,1-.107-2.443A1.7,1.7,0,0,1,2.868,12.364Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 56.115, 65.783)"
                />
                <path
                  id="Path_45"
                  data-name="Path 45"
                  d="M6.094,0A6.068,6.068,0,1,1,0,6.067,6.084,6.084,0,0,1,6.094,0ZM7.464,5.772A1.718,1.718,0,1,0,5.718,4.054,1.772,1.772,0,0,0,7.464,5.772Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 84.938, 58.681)"
                  fill="#b1832d"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
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
                  {' '}
                  &#10003; AI checks an image to match a breed. Mixed breed it
                  guesses but knows it&apos;s a dog.{' '}
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
            <button className="uploadImage" onClick={triggerUpload}>
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

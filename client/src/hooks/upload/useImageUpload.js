import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import performanceMonitor from '../../utilities/performanceMonitor'
import logger from '../../utilities/logger'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

export const useImageUpload = ({
  setShowSecondButton,
  setHideImageUpload,
  model,
  dogBreeds,
}) => {
  const [cookies] = useCookies(null)
  const [file, setFile] = useState()
  const [imageURL, setImageURL] = useState(null)
  const [results, setResults] = useState([])
  const [submitPicture, setSubmitPicture] = useState(false)
  const [hideText, setHideText] = useState(false)

  const imageRef = useRef()
  const fileInputRef = useRef()

  const submit = useCallback(
    async (event) => {
      event.preventDefault()
      setShowSecondButton(true)
      setHideImageUpload(true)

      const formData = new FormData()
      formData.append('UserId', cookies.UserId)
      formData.append('image', file)

      await axios.put(`${API_URL}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    [cookies.UserId, file, setShowSecondButton, setHideImageUpload]
  )

  const fileSelected = useCallback((e) => {
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
  }, [])

  const identify = useCallback(async () => {
    // Check if model is loaded
    if (!model) {
      logger.error('Model not loaded yet')
      alert('AI model is still loading. Please wait a moment and try again.')
      return
    }

    // Check if image is available
    if (!imageRef.current) {
      logger.error('Image not loaded yet')
      alert('Please wait for the image to load completely.')
      return
    }

    try {
      logger.log('Classifying image...')
      performanceMonitor.mark('tensorflow_inference')
      const results = await model.classify(imageRef.current)
      performanceMonitor.measure('tensorflow_inference')
      logger.log('Classification results:', results)
      setResults(results)
      setSubmitPicture(true)
    } catch (error) {
      logger.error('Error during image classification:', error)
      performanceMonitor.measure('tensorflow_inference')
      alert('Error analyzing image. Please try again.')
    }
  }, [model])

  const triggerUpload = useCallback(() => {
    fileInputRef.current.click()
    setHideText(true)
  }, [])

  // Memoize expensive computations
  const dogFound = useMemo(
    () =>
      results.filter((dog) => dogBreeds.includes(dog.className.toLowerCase())),
    [results, dogBreeds]
  )

  // Cleanup image URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imageURL) {
        URL.revokeObjectURL(imageURL)
      }
    }
  }, [imageURL])

  return {
    // State
    file,
    imageURL,
    results,
    submitPicture,
    hideText,
    dogFound,

    // Refs
    imageRef,
    fileInputRef,

    // Handlers
    submit,
    fileSelected,
    identify,
    triggerUpload,
  }
}

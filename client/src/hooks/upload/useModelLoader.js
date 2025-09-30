import { useState, useCallback } from 'react'
import {
  preloadTensorFlow,
  getTensorFlowModules,
} from '../../utilities/tensorflowPreloader'
import performanceMonitor from '../../utilities/performanceMonitor'
import logger from '../../utilities/logger'

export const useModelLoader = () => {
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [dogBreeds, setDogBreeds] = useState([])
  const [modelLoadRequested, setModelLoadRequested] = useState(false)

  const loadModel = useCallback(async () => {
    setIsModelLoading(true)
    performanceMonitor.mark('tensorflow_model_load')

    try {
      logger.log('Loading TensorFlow.js, MobileNet, and dog breeds...')

      // Use preloader to get modules
      const modules =
        (await getTensorFlowModules()) || (await preloadTensorFlow())
      const { tf, mobilenet, dogBreedsModule } = modules

      // Set dog breeds
      setDogBreeds(dogBreedsModule.default)

      logger.log('Initializing TensorFlow.js backends...')

      // Initialize TensorFlow.js with WebGL backend, fallback to CPU
      await tf.ready()

      // Try to set WebGL backend, fallback to CPU if it fails
      try {
        await tf.setBackend('webgl')
        logger.log('Using WebGL backend')
      } catch (webglError) {
        logger.warn('WebGL backend failed, falling back to CPU:', webglError)
        await tf.setBackend('cpu')
        logger.log('Using CPU backend')
      }

      logger.log('Loading MobileNet model...')
      const model = await mobilenet.load()
      setModel(model)
      setIsModelLoading(false)
      performanceMonitor.measure('tensorflow_model_load')
      logger.log('Model loaded successfully')
    } catch (error) {
      logger.error('Failed to load model:', error)
      setIsModelLoading(false)
      performanceMonitor.measure('tensorflow_model_load')
    }
  }, [])

  const handlePreload = useCallback(() => {
    // Start preloading TensorFlow when user shows intent (hover/focus)
    if (!modelLoadRequested && !model) {
      preloadTensorFlow().catch(logger.error)
    }
  }, [modelLoadRequested, model])

  const requestModelLoad = useCallback(() => {
    if (!modelLoadRequested && !model) {
      setModelLoadRequested(true)
      loadModel()
    }
  }, [modelLoadRequested, model, loadModel])

  return {
    isModelLoading,
    model,
    dogBreeds,
    modelLoadRequested,
    loadModel,
    handlePreload,
    requestModelLoad,
  }
}

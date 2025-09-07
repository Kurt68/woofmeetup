// Utility for preloading TensorFlow.js resources
let preloadPromise = null
let isPreloading = false

export const preloadTensorFlow = () => {
  if (preloadPromise || isPreloading) {
    return preloadPromise
  }

  isPreloading = true

  preloadPromise = Promise.all([
    // Preload the modules without executing them
    import('@tensorflow/tfjs'),
    import('@tensorflow-models/mobilenet'),
    import('../data/dogBreeds.json'),
  ])
    .then(([tf, mobilenet, dogBreedsModule]) => {
      isPreloading = false
      return { tf, mobilenet, dogBreedsModule }
    })
    .catch((error) => {
      isPreloading = false
      preloadPromise = null
      throw error
    })

  return preloadPromise
}

export const getTensorFlowModules = () => {
  return preloadPromise
}

export const isPreloaded = () => {
  return preloadPromise !== null && !isPreloading
}

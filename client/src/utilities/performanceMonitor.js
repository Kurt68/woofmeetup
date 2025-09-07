// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.init()
  }

  init() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      this.observeWebVitals()
    }

    // Monitor resource loading
    this.observeResourceTiming()

    // Monitor TensorFlow loading specifically
    this.observeTensorFlowLoading()
  }

  // Mark the start of an operation
  mark(name) {
    const startTime = performance.now()
    this.metrics.set(`${name}_start`, startTime)
    console.log(`🚀 Started: ${name}`)
    return startTime
  }

  // Mark the end of an operation and calculate duration
  measure(name) {
    const endTime = performance.now()
    const startTime = this.metrics.get(`${name}_start`)

    if (startTime) {
      const duration = endTime - startTime
      this.metrics.set(`${name}_duration`, duration)
      console.log(`✅ Completed: ${name} in ${duration.toFixed(2)}ms`)
      return duration
    }

    console.warn(`⚠️ No start time found for: ${name}`)
    return null
  }

  // Monitor resource loading times
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (
            entry.name.includes('tensorflow') ||
            entry.name.includes('mobilenet')
          ) {
            console.log(
              `📦 TensorFlow Resource: ${entry.name
                .split('/')
                .pop()} - ${entry.duration.toFixed(2)}ms`
            )
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    }
  }

  // Monitor TensorFlow specific loading
  observeTensorFlowLoading() {
    // This will be called from the ImageUpload component
    window.tfPerformance = {
      markModelLoadStart: () => this.mark('tensorflow_model_load'),
      markModelLoadEnd: () => this.measure('tensorflow_model_load'),
      markInferenceStart: () => this.mark('tensorflow_inference'),
      markInferenceEnd: () => this.measure('tensorflow_inference'),
    }
  }

  // Get all metrics
  getMetrics() {
    const metrics = {}
    this.metrics.forEach((value, key) => {
      metrics[key] = value
    })
    return metrics
  }

  // Report performance summary
  reportSummary() {
    console.group('📊 Performance Summary')

    const modelLoadTime = this.metrics.get('tensorflow_model_load_duration')
    if (modelLoadTime) {
      console.log(`🧠 TensorFlow Model Load: ${modelLoadTime.toFixed(2)}ms`)
    }

    const inferenceTime = this.metrics.get('tensorflow_inference_duration')
    if (inferenceTime) {
      console.log(`🔍 Image Inference: ${inferenceTime.toFixed(2)}ms`)
    }

    // Navigation timing
    if (performance.navigation) {
      const navTiming = performance.getEntriesByType('navigation')[0]
      if (navTiming) {
        console.log(`🌐 Page Load: ${navTiming.loadEventEnd.toFixed(2)}ms`)
        console.log(
          `🎨 DOM Content Loaded: ${navTiming.domContentLoadedEventEnd.toFixed(
            2
          )}ms`
        )
      }
    }

    console.groupEnd()
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor()

// Auto-report after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.reportSummary()
  }, 1000)
})

export default performanceMonitor

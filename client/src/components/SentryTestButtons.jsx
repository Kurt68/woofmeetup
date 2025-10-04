import { logger } from '../utilities/logger'

const SentryTestButtons = () => {
  const triggerJavaScriptError = () => {
    logger.info('User clicked: Trigger JavaScript Error button')
    // This will throw an uncaught error
    throw new Error(
      '🧪 Test JavaScript Error - This is intentional for Sentry testing!'
    )
  }

  const triggerAsyncError = async () => {
    logger.info('User clicked: Trigger Async Error button')
    try {
      // Simulate an async operation that fails
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              '🧪 Test Async Error - This is intentional for Sentry testing!'
            )
          )
        }, 100)
      })
    } catch (error) {
      logger.error('Async operation failed:', error)
      throw error // Re-throw to trigger Sentry
    }
  }

  const triggerCustomError = () => {
    logger.info('User clicked: Trigger Custom Error button')
    // Use logger to send a custom error to Sentry
    logger.error(
      '🧪 Test Custom Error - This is intentional for Sentry testing!',
      {
        testType: 'custom_error',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }
    )
  }

  const triggerPerformanceTest = () => {
    logger.info('User clicked: Trigger Performance Test button')
    // Simulate a slow operation for performance monitoring
    const startTime = performance.now()

    // Simulate heavy computation
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.random()
    }

    const endTime = performance.now()
    logger.performance('Heavy computation completed', {
      duration: endTime - startTime,
      iterations: 1000000,
      result: result,
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '14px' }}>
        🧪 Sentry Test Panel
      </h4>

      <button
        onClick={triggerJavaScriptError}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        💥 Trigger JS Error
      </button>

      <button
        onClick={triggerAsyncError}
        style={{
          background: '#ff8844',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        ⚡ Trigger Async Error
      </button>

      <button
        onClick={triggerCustomError}
        style={{
          background: '#4488ff',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        📝 Log Custom Error
      </button>

      <button
        onClick={triggerPerformanceTest}
        style={{
          background: '#44ff88',
          color: 'black',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🚀 Performance Test
      </button>
    </div>
  )
}

export default SentryTestButtons

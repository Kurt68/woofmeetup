import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Add bundle analyzer in analyze mode
    ...(mode === 'analyze'
      ? [
          {
            name: 'bundle-analyzer',
            generateBundle(options, bundle) {
              const chunks = Object.entries(bundle)
                .filter(([, chunk]) => chunk.type === 'chunk')
                .map(([name, chunk]) => ({
                  name,
                  size: chunk.code.length,
                  modules: Object.keys(chunk.modules || {}).length,
                }))
                .sort((a, b) => b.size - a.size)

              console.log('\n📊 Bundle Analysis:')
              console.log('==================')
              chunks.forEach((chunk) => {
                const sizeKB = (chunk.size / 1024).toFixed(2)
                console.log(
                  `${chunk.name}: ${sizeKB}KB (${chunk.modules} modules)`
                )
              })
              console.log('==================\n')
            },
          },
        ]
      : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // TensorFlow.js and related models - largest chunk
          if (
            id.includes('@tensorflow/tfjs') ||
            id.includes('@tensorflow-models/mobilenet')
          ) {
            return 'tensorflow'
          }

          // React ecosystem
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor'
          }

          // Large UI libraries
          if (
            id.includes('react-tinder-card') ||
            id.includes('react-tooltip') ||
            id.includes('@react-spring/web') ||
            id.includes('lucide-react')
          ) {
            return 'ui-libs'
          }

          // Network and state management utilities
          if (
            id.includes('axios') ||
            id.includes('socket.io-client') ||
            id.includes('zustand') ||
            id.includes('react-cookie')
          ) {
            return 'utils'
          }

          // Routing
          if (id.includes('react-router-dom')) {
            return 'router'
          }

          // Toast notifications
          if (id.includes('react-hot-toast')) {
            return 'toast'
          }

          // Node modules that aren't specifically chunked above
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
    // Optimize build settings
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Increase chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (optional)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      'react-router-dom',
      'react-cookie',
      'zustand',
      'react-hot-toast',
    ],
    exclude: ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
  },
}))

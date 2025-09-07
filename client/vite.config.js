import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate TensorFlow.js into its own chunk
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
          // Separate large UI libraries
          'ui-libs': [
            'react-tinder-card',
            'react-tooltip',
            '@react-spring/web',
          ],
          // Separate utility libraries
          'utils': ['axios', 'socket.io-client', 'uuid', 'zustand'],
        },
      },
    },
    // Increase chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 1000,
  },
})

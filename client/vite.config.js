import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Generate cache version from build timestamp for SW cache invalidation (YYYYMMDD format)
  const buildVersion = new Date().toISOString().split('T')[0].replace(/-/g, '')

  return {
    plugins: [
      react(),
      // Plugin to inject build version into service worker after build
      {
        name: 'inject-build-version-sw',
        apply: 'build',
        writeBundle() {
          const swPath = path.join(__dirname, 'dist', 'sw.js')
          try {
            let swContent = fs.readFileSync(swPath, 'utf-8')
            // Replace the __BUILD_VERSION__ = 'default' placeholder with actual version
            swContent = swContent.replace(
              /let __BUILD_VERSION__ = 'default'/,
              `let __BUILD_VERSION__ = '${buildVersion}'`
            )
            fs.writeFileSync(swPath, swContent, 'utf-8')
            console.log(
              `✅ Service Worker cache version set to: ${buildVersion}`
            )
          } catch (error) {
            console.warn(
              '⚠️  Could not inject build version into service worker:',
              error.message
            )
          }
        },
      },
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
          drop_console: true, // SECURITY FIX: Remove console.logs from production build to prevent data exposure
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
    },
    // Server configuration
    server: {
      fs: {
        strict: false,
      },
      middlewareMode: false,
      cors: true,
    },
    // Resolve configuration
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  }
})

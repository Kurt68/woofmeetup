// Service Worker for caching optimization
// Build version injected at build time to enable cache invalidation on each deployment
let __BUILD_VERSION__ = 'default' // Fallback; replaced at build time by Vite plugin
const CACHE_VERSION = __BUILD_VERSION__
const CACHE_NAME = `woof-meetup-${CACHE_VERSION}`

// Install event - skip old SWs and become active immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated with cache:', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME && cacheName.startsWith('woof-meetup-')
          )
          .map((cacheName) => {
            return caches.delete(cacheName).catch((error) => {
              // Silently handle cache deletion errors (e.g., already deleted)
            })
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event with stale-while-revalidate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // External requests (e.g., CloudFront images) are not cached
  // Pass through directly without service worker interception to avoid NS_ERROR_INTERCEPTION_FAIL
  if (url.origin !== location.origin) {
    return
  }

  // Cache strategy: Stale-While-Revalidate for app resources (only GET requests)
  if (url.origin === location.origin && request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Serve from cache immediately, but fetch and update in background
            fetch(request)
              .then((fetchResponse) => {
                if (fetchResponse && fetchResponse.ok) {
                  cache.put(request, fetchResponse.clone()).catch(() => {
                    // Silently handle cache storage errors (e.g., quota exceeded)
                  })
                }
              })
              .catch(() => {
                // Network error in background fetch - ignore, stale cache is fine
              })
            return response
          }

          // No cached response - fetch from network
          return fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse && fetchResponse.ok) {
                cache.put(request, fetchResponse.clone()).catch(() => {
                  // Silently handle cache storage errors
                })
              }
              return fetchResponse
            })
            .catch(() => {
              // Network error and no cache - return offline response
              return new Response('Offline: Service temporarily unavailable', {
                status: 503,
                statusText: 'Service Unavailable',
              })
            })
        })
      })
    )
  }
})

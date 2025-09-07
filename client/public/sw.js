// Service Worker for caching optimization
const CACHE_NAME = 'woof-meetup-v1'
const TENSORFLOW_CACHE = 'tensorflow-cache-v1'

// Cache TensorFlow.js resources with longer TTL
const TENSORFLOW_URLS = [
  // These will be dynamically imported, so we cache them when they're fetched
]

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== TENSORFLOW_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Cache TensorFlow.js resources with longer TTL
  if (
    url.pathname.includes('tensorflow') ||
    url.pathname.includes('mobilenet') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('unpkg.com')
  ) {
    event.respondWith(
      caches.open(TENSORFLOW_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            console.log('Serving TensorFlow resource from cache:', url.pathname)
            return response
          }

          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              console.log('Caching TensorFlow resource:', url.pathname)
              cache.put(request, fetchResponse.clone())
            }
            return fetchResponse
          })
        })
      })
    )
    return
  }

  // Cache app resources with standard strategy
  if (url.origin === location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Serve from cache, but also fetch in background for updates
            fetch(request)
              .then((fetchResponse) => {
                if (fetchResponse.ok) {
                  cache.put(request, fetchResponse.clone())
                }
              })
              .catch(() => {})
            return response
          }

          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone())
            }
            return fetchResponse
          })
        })
      })
    )
  }
})

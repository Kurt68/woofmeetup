import { useState } from 'react'
import axiosInstance from '../../config/axiosInstance'
import toast from 'react-hot-toast'

const GeolocationButton = ({ userId, onLocationUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)

  const success = async (position) => {
    const longitude = position.coords.longitude
    const latitude = position.coords.latitude

    try {
      // CRITICAL: Save coordinates to database FIRST before updating UI state
      // This prevents race condition where getMeetupTypeUsers() is called before
      // coordinates are persisted, causing "location not available" error
      const response = await axiosInstance.put('/api/auth/addcoordinates', {
        userId,
        longitude,
        latitude,
      })

      // Only update UI state AFTER coordinates are successfully saved
      if (response.status === 200) {
        localStorage.setItem('lastKnownCoordinates', JSON.stringify({ longitude, latitude }))
        onLocationUpdate({ longitude, latitude })
      }
    } catch (err) {
      console.error('❌ Error saving coordinates:', err)
      toast.error('Failed to save location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const error = (err) => {
    setIsLoading(false)
    console.error('❌ Geolocation error:', err.code, err.message)
    let errorMessage = 'Unable to get your location'
    if (err.code === err.PERMISSION_DENIED) {
      errorMessage =
        'Location permission denied. Please enable location access.'
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      errorMessage = 'Location information is unavailable.'
    } else if (err.code === err.TIMEOUT) {
      errorMessage = 'Location request timed out.'
    }
    toast.error(errorMessage)
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      })
    } else {
      toast.error('Geolocation is not supported by your browser')
    }
  }

  return (
    <button
      className="allow-geo-location"
      onClick={handleLocationClick}
      disabled={isLoading}
    >
      <p>{isLoading ? 'Getting location...' : 'Allow geolocation!'}</p>
    </button>
  )
}

export default GeolocationButton

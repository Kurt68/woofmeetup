import { useState } from 'react'
import axios from 'axios'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const GeolocationButton = ({ userId, onLocationUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)

  const success = async (position) => {
    const longitude = position.coords.longitude
    const latitude = position.coords.latitude

    onLocationUpdate({ longitude, latitude })

    try {
      await axios.put(`${API_URL}/addcoordinates`, {
        userId,
        longitude,
        latitude,
      })
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  const error = () => {
    console.log('Unable to retrieve your location')
    setIsLoading(false)
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(success, error)
    } else {
      console.log('Geolocation not supported')
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

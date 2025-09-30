import { useState } from 'react'

export const useGeolocation = () => {
  const [longitude, setLongitude] = useState(null)
  const [latitude, setLatitude] = useState(null)

  const updateLocation = ({ longitude, latitude }) => {
    setLongitude(longitude)
    setLatitude(latitude)
  }

  return {
    longitude,
    latitude,
    updateLocation,
  }
}

import { useState, useCallback } from 'react'
import axiosInstance from '../../config/axiosInstance'
import toast from 'react-hot-toast'

export const useSwipeLogic = (userId, getUser) => {
  const [lastDirection, setLastDirection] = useState()

  const updateMatches = useCallback(
    async (matchedUserId) => {
      try {
        await axiosInstance.put('/api/auth/addmatch', {
          userId,
          matchedUserId,
        })
        getUser()
      } catch (err) {
        console.error('Failed to add match:', err)

        // Provide more specific error messages for debugging
        if (err.isCsrfError) {
          toast.error('Security error: Please refresh the page and try again.')
          console.error('🔐 CSRF token validation failed during match')
        } else if (err.isAuthError) {
          toast.error('Session expired. Please log in again.')
          console.error(
            '🔐 Authentication error during match - session may be expired'
          )
        } else {
          toast.error('Failed to add match. Please try again.')
        }
      }
    },
    [userId, getUser]
  )

  const swiped = useCallback(
    (direction, swipedUserId) => {
      if (direction === 'right') {
        updateMatches(swipedUserId)
        toast.success('You waged right!', {
          duration: 2000,
        })
      } else if (direction === 'left') {
        toast('You waged left!', {
          duration: 2000,
          icon: '😥',
        })
      }
      setLastDirection(direction)
    },
    [updateMatches]
  )

  const outOfFrame = useCallback((name) => {
    console.log(name + ' left the screen!')
  }, [])

  return {
    lastDirection,
    swiped,
    outOfFrame,
  }
}

import { useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

export const useSwipeLogic = (userId, getUser) => {
  const [lastDirection, setLastDirection] = useState()

  const updateMatches = useCallback(
    async (matchedUserId) => {
      try {
        await axios.put(`${API_URL}/addmatch`, {
          userId,
          matchedUserId,
        })
        getUser()
      } catch (err) {
        console.log(err)
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

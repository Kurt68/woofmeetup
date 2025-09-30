import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

export const useDashboardData = (userId) => {
  const [user, setUser] = useState(null)
  const [meetupTypeUsers, setMeetupTypeUsers] = useState([])

  const [searchParams, setSearchParams] = useSearchParams({
    selectDistance: '10',
  })
  const selectDistance = searchParams.get('selectDistance')

  const getUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        params: { userId },
      })
      setUser(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [userId])

  const getMeetupTypeUsers = useCallback(
    async (overrideDistance) => {
      try {
        const response = await axios.get(`${API_URL}/meetup-type-users`, {
          params: {
            userId,
            selectDistance: overrideDistance ?? selectDistance,
          },
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })
        setMeetupTypeUsers(response.data)
      } catch (error) {
        console.log(error)
      }
    },
    [userId, selectDistance]
  )

  const handleDistanceChange = async (e) => {
    const current = e.target.value
    // Keep URL in sync for UI/state
    setSearchParams(
      (prev) => {
        prev.set('selectDistance', String(current))
        return prev
      },
      { replace: true }
    )
    try {
      const response = await axios.put(`${API_URL}/user-select-distance`, {
        userId,
        selectDistance: current,
      })
      if (response.status === 200) {
        // Fetch new cards immediately with the selected radius
        await getMeetupTypeUsers(current)
      }
    } catch (err) {
      console.log(err)
    }
  }

  // Filter out matched users
  const getFilteredUsers = (longitude, latitude) => {
    const matchedUserIdsandUser = user?.matches // database field
      .map(({ user_id }) => user_id) // create new array and return user_id
      .concat(userId) // add current user too

    const filteredMeetupTypeUsers = meetupTypeUsers?.filter(
      (meetupTypeUser) =>
        !matchedUserIdsandUser.includes(meetupTypeUser.user_id) // No matched UserId and User include meetupTypeUsers.user_id
    )

    // Show a toast hint if no users are available at small radius
    const radius = Number(selectDistance)
    if (
      longitude &&
      latitude &&
      Array.isArray(filteredMeetupTypeUsers) &&
      filteredMeetupTypeUsers.length === 0 &&
      radius <= 10
    ) {
      // Limit to showing at most twice per browser using localStorage counter
      const key = 'radius-hint-count'
      const count = Number(localStorage.getItem(key) || '0')
      if (count < 2) {
        toast.success(
          'Not seeing users? Increase your search radius to find more matches if they exist.',
          {
            id: 'radius-hint',
            duration: 4000,
          }
        )
        localStorage.setItem(key, String(count + 1))
      }
    }

    return filteredMeetupTypeUsers
  }

  useEffect(() => {
    getUser()
  }, [getUser])

  useEffect(() => {
    if (user) {
      getMeetupTypeUsers()
    }
  }, [user, getMeetupTypeUsers])

  return {
    user,
    meetupTypeUsers,
    selectDistance,
    getUser,
    getMeetupTypeUsers,
    handleDistanceChange,
    getFilteredUsers,
  }
}

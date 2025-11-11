import { useState, useCallback, useEffect } from 'react'
import axiosInstance from '../../config/axiosInstance'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export const useDashboardData = (userId) => {
  const [user, setUser] = useState(null)
  const [meetupTypeUsers, setMeetupTypeUsers] = useState([])

  const [searchParams, setSearchParams] = useSearchParams({
    selectDistance: '10',
  })
  const selectDistance = searchParams.get('selectDistance')

  const getUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/auth/user', {
        params: { userId, _t: Date.now() },
      })
      setUser(response.data)
    } catch (error) {
      // Error handled silently
    }
  }, [userId])

  const getMeetupTypeUsers = useCallback(
    async (overrideDistance) => {
      try {
        console.log(
          '🔍 Fetching meetup type users with distance:',
          overrideDistance ?? selectDistance
        )
        const response = await axiosInstance.get(
          '/api/auth/meetup-type-users',
          {
            params: {
              userId,
              selectDistance: overrideDistance ?? selectDistance,
              _t: Date.now(),
            },
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }
        )
        console.log(
          '✅ Meetup type users fetched:',
          response.data.length,
          'users found'
        )
        setMeetupTypeUsers(response.data)
      } catch (error) {
        console.error(
          '❌ Error fetching meetup type users:',
          error.response?.status,
          error.response?.data?.message || error.message
        )
        // Ensure state is cleared on error to show "no results" instead of stale data
        setMeetupTypeUsers([])
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
      const response = await axiosInstance.put(
        '/api/auth/user-select-distance',
        {
          userId,
          selectDistance: current,
        }
      )
      if (response.status === 200) {
        // Fetch new cards immediately with the selected radius
        await getMeetupTypeUsers(current)
      }
    } catch (err) {
      // Error handled silently
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
    const fetchInitialData = async () => {
      await getUser()
      // getMeetupTypeUsers will be called by the Dashboard component once location is set
    }
    fetchInitialData()
  }, [getUser])

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

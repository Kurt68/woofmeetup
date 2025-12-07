import { useState, useCallback } from 'react'
import axiosInstance from '../../config/axiosInstance'
import toast from 'react-hot-toast'
import { trackLikeConversion } from '../../services/analyticsService'

export const useLike = () => {
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  const createLike = useCallback(async (toUserId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.post(`/api/likes/${toUserId}`)
      if (response.data.success) {
        setLiked(true)
        toast.success('❤️ Profile liked!', {
          duration: 4000,
          icon: false,
        })
        trackLikeConversion()
        return true
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data?.data?.message || 'Could not like profile')
      } else {
        toast.error('Failed to like profile')
      }
    } finally {
      setLoading(false)
    }
    return false
  }, [])

  const checkIfLiked = useCallback(async (toUserId) => {
    try {
      const response = await axiosInstance.get(`/api/likes/check/${toUserId}`)
      if (response.data.success) {
        setLiked(response.data.data.liked)
        return response.data.data.liked
      }
    } catch (error) {
      // Error handled silently
    }
    return false
  }, [])

  const getLikes = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/likes')
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch likes')
      return null
    }
  }, [])

  const markLikesAsRead = useCallback(async () => {
    try {
      await axiosInstance.put('/api/likes/mark-as-read')
    } catch (error) {
      // Error handled silently
    }
  }, [])

  return {
    liked,
    setLiked,
    loading,
    createLike,
    checkIfLiked,
    getLikes,
    markLikesAsRead,
  }
}

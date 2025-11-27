import axiosInstance from '../../config/axiosInstance'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { SidebarSkeleton } from '../skeletons'

const MatchesDisplay = ({ matches, setSelectedUser, animatedMatchIds }) => {
  const [matchedProfiles, setMatchedProfiles] = useState(null)
  const { user } = useAuthStore()

  const [matchesLoading, setMatchesLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.user_id

  useEffect(() => {
    const fetchMatches = async () => {
      const matchedUserIds = matches?.map(({ user_id }) => user_id)
      try {
        setMatchesLoading(true)
        setError(null)

        if (!matchedUserIds || matchedUserIds.length === 0) {
          setMatchedProfiles([])
          return
        }

        const response = await axiosInstance.get('/api/auth/users', {
          params: { userIds: JSON.stringify(matchedUserIds), _t: Date.now() },
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })
        setMatchedProfiles(response.data.data.users)
      } catch (error) {
        setError('Failed to load matches. Please try again.')
      } finally {
        setMatchesLoading(false)
      }
    }

    fetchMatches()
  }, [matches])

  const filteredMatchedProfiles = matchedProfiles?.filter(
    (matchedProfile) =>
      matchedProfile.matches.filter((profile) => profile.user_id == userId)
        .length > 0
  )
  if (matchesLoading) return <SidebarSkeleton matches={error} />

  const handleMatchClick = (match) => {
    setSelectedUser(match)
  }

  if (!filteredMatchedProfiles || filteredMatchedProfiles.length === 0) {
    return null
  }

  return (
    <div className="matches-display">
      {filteredMatchedProfiles?.map((match) => (
        <div
          key={match.user_id}
          className={`match-button ${
            animatedMatchIds?.has(match.user_id) ? 'fountain-active' : ''
          }`}
          onClick={() => handleMatchClick(match)}
        >
          <img
            className="avatar"
            src={match?.imageUrl}
            alt={match?.dogs_name + ' profile'}
          />

          <h4>{match?.dogs_name}</h4>
        </div>
      ))}
    </div>
  )
}

export default MatchesDisplay

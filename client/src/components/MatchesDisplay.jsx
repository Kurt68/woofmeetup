import axios from 'axios'
import { useState, useCallback, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import SidebarSkeleton from './skeletons/SidebarSkeleton'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const MatchesDisplay = ({ matches, setClickedUser }) => {
  const [matchedProfiles, setMatchedProfiles] = useState(null)
  const [cookies] = useCookies(null)

  const [matchesLoading, setMatchesLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = cookies.UserId

  const getMatches = useCallback(async () => {
    const matchedUserIds = matches?.map(({ user_id }) => user_id)
    try {
      setMatchesLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/users`, {
        params: { userIds: JSON.stringify(matchedUserIds) },
      })
      setMatchedProfiles(response.data)
    } catch (error) {
      console.log(error)
      setError('Failed to load matches. Please try again.')
    } finally {
      setMatchesLoading(false)
    }
  }, [matches])

  useEffect(() => {
    getMatches()
  }, [getMatches])

  const filteredMatchedProfiles = matchedProfiles?.filter(
    (matchedProfile) =>
      matchedProfile.matches.filter((profile) => profile.user_id == userId)
        .length > 0
  )
  if (matchesLoading) return <SidebarSkeleton matches={error} />

  return (
    <div className="matches-display">
      {filteredMatchedProfiles?.map((match) => (
        <div
          key={match.user_id}
          className="match-button"
          onClick={() => setClickedUser(match)}
        >
          <img
            className="avatar"
            src={match?.imageUrl}
            alt={match?.dogs_name + ' profile'}
          />

          <h3>{match?.dogs_name}</h3>
        </div>
      ))}
    </div>
  )
}

export default MatchesDisplay

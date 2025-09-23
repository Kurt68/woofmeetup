import TinderCard from 'react-tinder-card'
import { useCallback, useEffect, useState } from 'react'
import ChatContainer from '../components/ChatContainer'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import { useSearchParams } from 'react-router-dom'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const Dashboard = () => {
  const [longitude, setLongitude] = useState(null)
  const [latitude, setLatitude] = useState(null)

  const success = (position) => {
    const longitude = position.coords.longitude
    const latitude = position.coords.latitude

    setLongitude(longitude)
    setLatitude(latitude)

    try {
      axios.put(`${API_URL}/addcoordinates`, {
        userId,
        longitude,
        latitude,
      })
    } catch (err) {
      console.log(err)
    }
  }
  const error = () => {
    console.log('Unable to retrieve your location')
  }

  function handleLocationClick() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error)
    } else {
      console.log('Geolocation not supported')
    }
  }

  const [user, setUser] = useState(null)
  const [meetupTypeUsers, setMeetupTypeUsers] = useState([])

  const [searchParams, setSearchParams] = useSearchParams({
    selectDistance: '10',
  })
  const selectDistance = searchParams.get('selectDistance')

  const [lastDirection, setLastDirection] = useState()
  const [cookies] = useCookies('user')
  const userId = cookies.UserId

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Read latest value from the form to avoid stale state during the same tick
    const selected =
      e.currentTarget?.elements?.distance?.value ?? selectDistance
    try {
      const response = await axios.put(`${API_URL}/user-select-distance`, {
        userId,
        selectDistance: selected,
      })
      const success = response.status === 200
      if (success) {
        getMeetupTypeUsers()
      }
    } catch (err) {
      console.log(err)
    }
  }

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

  const getMeetupTypeUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/meetup-type-users`, {
        params: {
          userId,
        },
      })
      setMeetupTypeUsers(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [userId])

  useEffect(() => {
    getUser()
  }, [getUser])

  useEffect(() => {
    if (user) {
      getMeetupTypeUsers()
    }
  }, [user, getMeetupTypeUsers])

  const updateMatches = async (matchedUserId) => {
    try {
      await axios.put(`${API_URL}/addmatch`, {
        userId,
        matchedUserId,
      })
      getUser()
    } catch (err) {
      console.log(err)
    }
  }

  const swiped = (direction, swipedUserId) => {
    if (direction === 'right') {
      updateMatches(swipedUserId)
    }
    setLastDirection(direction)
  }

  const outOfFrame = (name) => {
    console.log(name + ' left the screen!')
  }

  const matchedUserIdsandUser = user?.matches // database field
    .map(({ user_id }) => user_id) // create new array and return user_id
    .concat(userId) // add current user too

  const filteredMeetupTypeUsers = meetupTypeUsers?.filter(
    (meetupTypeUsers) =>
      !matchedUserIdsandUser.includes(meetupTypeUsers.user_id) // No matched UserId and User include meetupTypeUsers.user_id
  )

  // for testing Error Boundary
  // throw new Error('Component')
  return (
    <>
      {user && (
        <div className="dashboard">
          <ChatContainer user={user} />
          <div className="swipe-container">
            <div className="swipe-info">
              {lastDirection ? <p>You waged {lastDirection}!</p> : <p />}
            </div>
            {!longitude && !latitude ? (
              <button
                className="allow-geo-location"
                onClick={handleLocationClick}
              >
                <p>Allow geolocation!</p>
              </button>
            ) : null}

            <div className="polaroid-container">
              {longitude && latitude
                ? filteredMeetupTypeUsers?.map((filteredMeetupTypeUsers) => (
                    <TinderCard
                      className="swipe"
                      key={filteredMeetupTypeUsers.user_id}
                      onSwipe={(dir) =>
                        swiped(dir, filteredMeetupTypeUsers.user_id)
                      }
                      onCardLeftScreen={() =>
                        outOfFrame(filteredMeetupTypeUsers.dogs_name)
                      }
                      preventSwipe={['up', 'down']}
                      user={user}
                    >
                      <div className="polaroid">
                        <div
                          className="photo"
                          style={{
                            backgroundImage:
                              'url(' + filteredMeetupTypeUsers.imageUrl + ')',
                          }}
                        >
                          <div className="caption">
                            <p className="dog-info">
                              <span className="dogs_name">
                                {filteredMeetupTypeUsers.dogs_name}
                              </span>

                              <span
                                className={
                                  filteredMeetupTypeUsers.show_meetup_type
                                    ? 'hyphen'
                                    : ''
                                }
                              />

                              {filteredMeetupTypeUsers.show_meetup_type
                                ? filteredMeetupTypeUsers.meetup_type
                                : ''}

                              <span className="age">
                                {', '}
                                Age {filteredMeetupTypeUsers.age}
                              </span>
                              <span className="distance">
                                <br />
                                {
                                  filteredMeetupTypeUsers.distance_to_other_users
                                }{' '}
                                miles from you
                              </span>
                              <br />
                              <span className="about">
                                {filteredMeetupTypeUsers.about}
                              </span>

                              <span
                                className={
                                  filteredMeetupTypeUsers.meetup_type ==
                                  'Exercise Buddy'
                                    ? 'exercise-buddy'
                                    : '' ||
                                      filteredMeetupTypeUsers.meetup_type ==
                                        'Play Dates'
                                    ? 'play-dates'
                                    : '' ||
                                      filteredMeetupTypeUsers.meetup_type ==
                                        'Walk Companion'
                                    ? 'walk-companion'
                                    : ''
                                }
                              />
                            </p>
                          </div>
                        </div>
                      </div>
                    </TinderCard>
                  ))
                : null}
            </div>
            <div className="select-distance">
              <form onSubmit={handleSubmit}>
                <section>
                  <label htmlFor="distance">Search </label>
                  <select
                    name="distance"
                    id="distance"
                    value={selectDistance}
                    onChange={(e) =>
                      setSearchParams(
                        (prev) => {
                          prev.set('selectDistance', e.target.value)
                          return prev
                        },
                        { replace: true }
                      )
                    }
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="15">15 miles</option>
                    <option value="20">20 miles</option>
                    <option value="25">25 miles</option>
                    <option value="30">30 miles</option>
                    <option value="35">35 miles</option>
                    <option value="40">40 miles</option>
                    <option value="45">45 miles</option>
                    <option value="50">50 miles</option>
                    <option value="55">55 miles</option>
                    <option value="60">60 miles</option>
                  </select>

                  <button className="submit" type="submit">
                    Submit
                  </button>
                </section>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Dashboard

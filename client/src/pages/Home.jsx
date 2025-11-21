import { Nav } from '../components/layout'
import { AuthModal } from '../components/auth'
import { PageHead } from '../components/PageHead'
import { HomeShareButtons } from '../components/share'
import { useState } from 'react'
import { useCookies } from 'react-cookie'
import chatImage from '../images/chat-image.svg'

const Home = () => {
  const [showModal, setShowModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [cookies] = useCookies('user')

  const authToken = cookies.token

  const handleClick = () => {
    setShowModal(true)
    setIsSignUp(true)
  }

  return (
    <>
      <PageHead
        title="Home"
        description="Connect with dog owners and arrange meetups for your furry friends. Join Woof Meetup today!"
        ogTitle="Woof Meetup - Connect Dog Owners"
        ogDescription="Connect with dog owners and arrange meetups for your furry friends."
      />
      <div className="overlay">
        <Nav
          authToken={authToken}
          minimal={false}
          setShowModal={setShowModal}
          showModal={showModal}
          setIsSignUp={setIsSignUp}
        />
        <div className="home">
          <div className="primary-title">
            <img src={chatImage} alt="Chat bubble" className="primary-title-image" />
            <h1>Wag Right</h1>
          </div>
          <button className="primary-button" onClick={handleClick}>
            Create Account
          </button>

          {showModal && (
            <AuthModal setShowModal={setShowModal} isSignUp={isSignUp} />
          )}
        </div>
        <HomeShareButtons />
      </div>
    </>
  )
}
export default Home

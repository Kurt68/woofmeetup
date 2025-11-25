import { Nav } from '../components/layout'
import { AuthModal } from '../components/auth'
import { PageHead } from '../components/PageHead'
import { HomeShareButtons } from '../components/share'
import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import { useSearchParams } from 'react-router-dom'

const Home = () => {
  const [showModal, setShowModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [cookies] = useCookies('user')
  const [searchParams] = useSearchParams()
  const [referralSource, setReferralSource] = useState(null)

  const authToken = cookies.token

  useEffect(() => {
    const referral = searchParams.get('referral')
    if (referral) {
      setReferralSource(referral)
    }
  }, [searchParams])

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
          <h1 className="primary-title">"Wag Right"</h1>
          <button className="primary-button" onClick={handleClick}>
            Create Account
          </button>

          {showModal && (
            <AuthModal setShowModal={setShowModal} isSignUp={isSignUp} referralSource={referralSource} />
          )}
        </div>
        <HomeShareButtons />
      </div>
    </>
  )
}
export default Home

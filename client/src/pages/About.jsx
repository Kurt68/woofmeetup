import { PageHead } from '../components/PageHead'
import { useNavigate } from 'react-router-dom'
import { Nav } from '../components/layout'
import { useCookies } from 'react-cookie'

const About = () => {
  const navigate = useNavigate()
  const [cookies] = useCookies('user')
  const authToken = cookies.token

  const handleClose = () => {
    navigate(-1)
  }

  return (
    <>
      <PageHead
        title="About Us"
        description="Woof Meetup: Connect dog owners nearby for playdates and meetups. Free to start with 10 credits. Join our community of dog lovers today."
        ogTitle="Woof Meetup - Connect Dog Owners Nearby"
        ogDescription="Connect with dog owners in your area. Start free with 10 credits, swipe to match, and arrange meetups for your furry friends."
        ogUrl="https://www.woofmeetup.com/about"
      />
      <div className="overlay">
        <Nav authToken={authToken} minimal={false} />
        <div className="about-modal-overlay">
          <div className="about-modal">
            <div className="about-modal-header">
              <h3 className="about-modal-title">About Woof Meetup</h3>
              <button
                className="about-modal-close-icon"
                onClick={handleClose}
                aria-label="Close"
                type="button"
              >
                &#x2715;
              </button>
            </div>

            <div className="about-modal-scroll">
              <div className="about-modal-content">
                <section className="about-modal-section">
                  <h2>Our Mission</h2>
                  <p>
                    Woof Meetup is a web app designed to help dog owners find and connect with other
                    dog owners and their pets nearby. We believe that dogs are social creatures, and
                    so are their owners. Our mission is to create a community where dog lovers can
                    easily arrange local meetups, build lasting friendships, and give their furry
                    companions the social life they deserve.
                  </p>
                </section>

                <section className="about-modal-section">
                  <h2>How It Works</h2>
                  <div className="about-modal-features">
                    <div className="about-modal-feature">
                      <h3>Create Your Profile</h3>
                      <p>
                        Build a profile for yourself and your dog. Share photos, personality traits,
                        and interests to help other dog lovers get to know you.
                      </p>
                    </div>
                    <div className="about-modal-feature">
                      <h3>Wag Right & Match</h3>
                      <p>
                        Browse nearby dogs using our intuitive swipe interface. Wag right on
                        profiles you like, and when there's a match, start chatting immediately.
                      </p>
                    </div>
                    <div className="about-modal-feature">
                      <h3>Chat & Connect</h3>
                      <p>
                        Get 10 free credits upon sign up to start messaging. Exchange messages, plan
                        meetups, and arrange playdates with other dog owners in your area.
                      </p>
                    </div>
                    <div className="about-modal-feature">
                      <h3>Arrange Meetups</h3>
                      <p>
                        Coordinate local meetups with like-minded dog lovers. Whether it's a park
                        gathering or casual coffee date, make connections that matter.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="about-modal-section">
                  <h2>Key Features</h2>
                  <ul className="about-modal-list">
                    <li>
                      <strong>Matching and Chatting:</strong> Users can wag right through the
                      interface allowing matching and chatting with 10 free credits upon sign up.
                    </li>
                    <li>
                      <strong>Community:</strong> The app aims to allow users to find users nearby
                      and set up local meetups for like-minded dog lovers.
                    </li>
                    <li>
                      <strong>Flexible Plans:</strong> Start free with 10 credits. Users can
                      purchase credit tiers or become a premium member for $9.99/month with
                      unlimited messaging.
                    </li>
                    <li>
                      <strong>Growing Features:</strong> As new features are added, premium members
                      will have full access and priority support.
                    </li>
                  </ul>
                </section>

                <section className="about-modal-section">
                  <h2>Our Community</h2>
                  <p>
                    Woof Meetup is built by dog lovers, for dog lovers. We're passionate about
                    creating a safe, inclusive space where dog owners can connect, share
                    experiences, and build a thriving community. Every feature we develop is
                    designed with our community's needs in mind.
                  </p>
                </section>

                <section className="about-modal-section">
                  <h2>Getting Started</h2>
                  <p>
                    Woof Meetup is <strong>free to start</strong>. Every new user receives 10
                    credits upon sign up to begin matching and chatting with other dog owners.
                  </p>
                  <br />
                  <div className="about-modal-pricing">
                    <div className="about-modal-pricing-item">
                      <h4>Free Plan</h4>
                      <div className="price">
                        <span className="amount">$0</span>
                        <span className="period">/month</span>
                      </div>
                      <p>10 credits upon sign up</p>
                    </div>
                    <div className="about-modal-pricing-item featured">
                      <span className="badge">Great Value</span>
                      <h4>Premium Plan</h4>
                      <div className="price">
                        <span className="amount">$9.99</span>
                        <span className="period">/month</span>
                      </div>
                      <p>Unlimited messaging + new features</p>
                    </div>
                    <div className="about-modal-pricing-item">
                      <h4>Buy Credits</h4>
                      <div className="price">
                        <span className="amount">Flexible</span>
                        <span className="period">options</span>
                      </div>
                      <p>Purchase as you go</p>
                    </div>
                  </div>
                </section>

                <section className="about-modal-section">
                  <h2>Join Our Community Today</h2>
                  <p>
                    Start connecting with dog lovers in your area and arrange amazing meetups for
                    you and your furry friend.
                  </p>
                  <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                    <button onClick={handleClose} className="primary-button" type="button">
                      Get Started Free
                    </button>
                  </div>
                </section>
              </div>
            </div>

            <div className="about-modal-footer" />
          </div>
        </div>
      </div>
    </>
  )
}

export default About

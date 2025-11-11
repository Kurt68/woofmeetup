const UserProfileSection = ({
  formData,
  handleChange,
  userAboutError = '',
}) => {
  const userAboutLength = formData.userAbout ? formData.userAbout.length : 0

  return (
    <div className="user-profile-section">
      <label htmlFor="userAge">
        <strong>Your Age (Optional)</strong>
      </label>
      <input
        type="number"
        id="userAge"
        name="userAge"
        placeholder="Your Age"
        value={formData.userAge || ''}
        onChange={handleChange}
      />

      <label htmlFor="userAbout">
        <strong>About You & Your Dog</strong>
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 'normal',
            marginLeft: '0.5rem',
          }}
        >
          ({userAboutLength}/100)
        </span>
      </label>
      <textarea
        id="userAbout"
        name="userAbout"
        placeholder="Tell others about yourself..."
        value={formData.userAbout || ''}
        onChange={handleChange}
        maxLength="100"
        style={{ height: '8rem' }}
        required={true}
      />
      {userAboutError && (
        <p className="server-error" role="alert">
          {userAboutError}
        </p>
      )}
    </div>
  )
}

export default UserProfileSection

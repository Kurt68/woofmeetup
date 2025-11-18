const UserProfileSection = ({
  formData,
  handleChange,
  userAboutError = '',
}) => {
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
      </label>
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--color-gray-text)',
          marginBottom: '0.5rem',
        }}
      >
        Press Enter twice to create paragraphs
      </div>
      <textarea
        id="userAbout"
        name="userAbout"
        placeholder="Tell others about yourself..."
        value={formData.userAbout || ''}
        onChange={handleChange}
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

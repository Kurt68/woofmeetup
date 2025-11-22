const DogProfileForm = ({ formData, handleChange, aboutError }) => {
  const aboutLength = formData.about ? formData.about.length : 0

  return (
    <div className="dog-profile-section">
      <label htmlFor="dogs_name">
        <strong>Dogs Name</strong>
      </label>
      <input
        type="text"
        id="dogs_name"
        name="dogs_name"
        placeholder="Dogs Name"
        required={true}
        value={formData.dogs_name}
        onChange={handleChange}
      />

      <label htmlFor="age">
        <strong>Age</strong>
      </label>
      <input
        type="number"
        id="age"
        name="age"
        placeholder="Age"
        required={true}
        value={formData.age}
        onChange={handleChange}
      />

      <label htmlFor="about">
        <strong>About Your Dog</strong>
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 'normal',
            marginLeft: '0.5rem',
            color: aboutLength >= 26 ? 'var(--color-error-dark)' : 'var(--color-gray-text)',
          }}
        >
          ({aboutLength}/26)
        </span>
      </label>
      <input
        type="text"
        id="about"
        name="about"
        required={true}
        placeholder="I like to play ball..."
        value={formData.about}
        onChange={handleChange}
        maxLength="26"
      />
      {aboutError && (
        <p className="server-error" role="alert">
          {aboutError}
        </p>
      )}
    </div>
  )
}

export default DogProfileForm

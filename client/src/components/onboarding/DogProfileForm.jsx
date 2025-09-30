const DogProfileForm = ({ formData, handleChange, aboutError }) => {
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
        <strong>About Me</strong>
      </label>
      <input
        type="text"
        id="about"
        name="about"
        required={true}
        placeholder="I like to play ball..."
        value={formData.about}
        onChange={handleChange}
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

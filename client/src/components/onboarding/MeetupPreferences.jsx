const MeetupPreferences = ({ formData, handleChange }) => {
  const meetupTypes = [
    { id: 'meetup-type-play-dates', value: 'Play Dates', label: 'Play Dates' },
    {
      id: 'meetup-type-exercise-buddy',
      value: 'Exercise Buddy',
      label: 'Exercise Buddy',
    },
    {
      id: 'meetup-type-walk-companion',
      value: 'Walk Companion',
      label: 'Walk Companion',
    },
  ]

  const meetupInterests = [
    { id: 'play-dates-interest', value: 'Play Dates', label: 'Play Dates' },
    {
      id: 'exercise-buddy-interest',
      value: 'Exercise Buddy',
      label: 'Exercise Buddy',
    },
    {
      id: 'walk-companion-interest',
      value: 'Walk Companion',
      label: 'Walk Companion',
    },
    {
      id: 'all-meetup-types',
      value: 'Show all meetup activites',
      label: 'Show all meetup activities',
    },
  ]

  return (
    <div className="meetup-preferences-section">
      <label>
        <strong>Choose a Meetup</strong>
      </label>
      <div className="multiple-input-container">
        {meetupTypes.map((type) => (
          <div key={type.id}>
            <input
              type="radio"
              id={type.id}
              name="meetup_type"
              value={type.value}
              onChange={handleChange}
              checked={formData.meetup_type === type.value}
            />
            <label htmlFor={type.id}>{type.label}</label>
          </div>
        ))}
      </div>

      <label>
        <strong>Show Me</strong>
      </label>
      <div className="multiple-input-container">
        {meetupInterests.map((interest) => (
          <div key={interest.id}>
            <input
              type="radio"
              id={interest.id}
              name="meetup_interest"
              value={interest.value}
              onChange={handleChange}
              checked={formData.meetup_interest === interest.value}
            />
            <label htmlFor={interest.id}>{interest.label}</label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MeetupPreferences

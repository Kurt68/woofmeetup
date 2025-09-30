const DistanceSelector = ({ selectDistance, onDistanceChange }) => {
  const distanceOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

  return (
    <div className="select-distance">
      <section>
        <select
          name="distance"
          id="distance"
          value={selectDistance}
          onChange={onDistanceChange}
        >
          {distanceOptions.map((distance) => (
            <option key={distance} value={distance}>
              {distance} miles
            </option>
          ))}
        </select>
      </section>
    </div>
  )
}

export default DistanceSelector

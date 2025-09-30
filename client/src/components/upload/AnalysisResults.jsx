const AnalysisResults = ({ dogFound }) => {
  if (dogFound.length === 0) {
    return (
      <div className="resultsHolder">
        <div className="result">
          <span className="confidence"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="resultsHolder">
      {dogFound.map((dog, index) => (
        <div className="result" key={`${dog.className}-${index}`}>
          <span className="name">
            <strong>{dog.className}</strong>{' '}
          </span>
          <span className="confidence">
            Confidence level: <span>{(dog.probability * 100).toFixed(2)}%</span>
            {index === 0 && (
              <>
                <hr />
                <span className="bestGuess">Best Guess</span>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AnalysisResults

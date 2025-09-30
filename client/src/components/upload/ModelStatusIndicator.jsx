const ModelStatusIndicator = ({ isModelLoading, model }) => {
  if (isModelLoading) {
    return (
      <div className="model-loading-alert">
        Loading AI Model... Please wait, this may take a moment.
      </div>
    )
  }

  if (!isModelLoading && model) {
    return (
      <div className="model-ready-alert">
        &#10003;AI Dog Model Ready - You can now analyze images!
      </div>
    )
  }

  return null
}

export default ModelStatusIndicator

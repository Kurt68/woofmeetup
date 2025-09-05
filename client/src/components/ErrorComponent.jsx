const ErrorComponent = () => {
  setTimeout(() => {
    location.replace('/')
  }, 4000)

  return (
    <>
      <div className="error-background">
        <div className="warning">&#9888;</div>
        <h3>
          There has been an error in the app. <br />
          You will be redirected home where you can signout and log back in.
        </h3>
      </div>
    </>
  )
}

export default ErrorComponent

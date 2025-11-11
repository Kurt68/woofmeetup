const PasswordConfirmField = ({ value, onChange, passwordMatchError }) => {
  return (
    <div className={`form-group ${passwordMatchError ? 'error' : ''}`}>
      <label className="label" htmlFor="password-check">
        Password Confirm
      </label>
      <input
        type="password"
        id="password-check"
        name="password-check"
        placeholder="Confirm Password"
        value={value}
        onChange={onChange}
      />
      <br />
      {passwordMatchError && <div className="msg">{passwordMatchError}</div>}
    </div>
  )
}

export default PasswordConfirmField

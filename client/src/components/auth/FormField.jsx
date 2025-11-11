const FormField = ({
  label,
  type = 'text',
  id,
  name,
  placeholder,
  value,
  onChange,
  errors = [],
  className = '',
}) => {
  return (
    <div
      className={`form-group ${errors.length > 0 ? 'error' : ''} ${className}`}
    >
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        className="input"
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {errors.length > 0 && (
        <div className="msg">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FormField

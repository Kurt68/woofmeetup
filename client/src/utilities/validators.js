export function checkEmail(email) {
  const errors = []

  if (email.length === 0) {
    errors.push('Email address is required\n')
  }

  let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  let isValid = email.match(regex)

  if (!isValid && email.length !== 0) {
    errors.push('Invalid email address\n')
  }
  return errors
}

export function checkPassword(password) {
  const errors = []

  if (password.length < 10) {
    errors.push('Must be at least 10 characters\n')
  }

  if (!password.match(/[a-z]/)) {
    errors.push('Must include at least 1 lowercase letter\n')
  }

  if (!password.match(/[A-Z]/)) {
    errors.push('Must include at least 1 uppercase letter\n')
  }

  if (!password.match(/[0-9]/)) {
    errors.push('Must include at least 1 number\n')
  }
  if (!password.match(/[!-/:-@[-`{-~]/)) {
    errors.push('Must include at least 1 special character\n')
  }

  return errors
}

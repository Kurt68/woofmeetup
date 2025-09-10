import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'

const EmailVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])
  const navigate = useNavigate()

  const { authError, isLoading, verifyEmail } = useAuthStore()

  const handleChange = (index, value) => {
    const newCode = [...code]

    // Handle pasted content
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('')
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || ''
      }
      setCode(newCode)

      // Focus on the last non-empty input or the first empty one
      const lastFilledIndex = newCode.findLastIndex((digit) => digit !== '')
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5
      inputRefs.current[focusIndex].focus()
    } else {
      newCode[index] = value
      setCode(newCode)

      // Move focus to the next input field if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const verificationCode = code.join('')
      try {
        await verifyEmail(verificationCode)
        navigate('/onboarding')
        toast.success('Email verified successfully')
      } catch (error) {
        console.log(error)
      }
    },
    [code, navigate, verifyEmail]
  )

  // Auto submit when all fields are filled
  useEffect(() => {
    if (code.every((digit) => digit !== '')) {
      handleSubmit(new Event('submit'))
    }
  }, [code, handleSubmit])

  return (
    <div className="overlay">
      <Nav minimal={true} />
      <div className="auth-modal">
        <h2>Verify Your Email</h2>
        <p className="modal-copy">
          Copy and paste the 6-digit code sent to your email address in the
          input field below. Check your junk/spam folder if you can't find it.
        </p>

        <form onSubmit={handleSubmit} className="form-verify-email">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="6"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className=""
            />
          ))}
        </form>
        {authError && <p className="auth-error">{authError}</p>}
        <button
          type="submit"
          disabled={isLoading || code.some((digit) => !digit)}
          className="secondary-button"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </div>
    </div>
  )
}
export default EmailVerification

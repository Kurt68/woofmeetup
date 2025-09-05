// // Store CAPTCHA challenges and their solutions with timestamps
let captchas = []

const captchaExpirationTime = 300000 // 5 minutes

// Middleware to verify CAPTCHA token and expiration
export const verifyCaptchaToken = (req, res, next) => {
  const captchaToken = req.body.captchaToken
  if (!captchaToken) {
    return res.status(400).json({ message: 'No CAPTCHA token provided.' })
  }
  const captcha = captchas.find((c) => c.token === captchaToken)

  if (!captcha) {
    return res.status(400).json({ message: 'Invalid CAPTCHA token.' })
  }
  // Check if the CAPTCHA has expired
  const currentTime = new Date()
  if (currentTime - captcha.timestamp > captchaExpirationTime) {
    captchas = captchas.filter((item) => item.token !== captchaToken)
    return res.status(400).json({ message: 'CAPTCHA has expired.' })
  }
  req.captcha = captcha
  next()
}
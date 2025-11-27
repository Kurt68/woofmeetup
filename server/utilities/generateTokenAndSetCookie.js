import jwt from 'jsonwebtoken'

export const generateTokenAndSetCookie = (res, userId, _id, email) => {
  const token = jwt.sign({ userId, _id, email }, process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 day expiration (balances security with UX - dating app users should stay logged in)
  })

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds - reasonable session duration for dating app
    path: '/', // Ensure cookie is available on all paths
  })
  return token
}

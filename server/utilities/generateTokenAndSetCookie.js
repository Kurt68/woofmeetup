import jwt from 'jsonwebtoken'

export const generateTokenAndSetCookie = (res, userId, _id) => {
  const token = jwt.sign({ userId, _id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  res.cookie('UserId', userId)
  return token
}

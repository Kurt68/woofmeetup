import 'dotenv/config'
import { app, server } from './lib/socket.js'
import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connectDB.js'
import path from 'path'
import cookieParser from 'cookie-parser'
import { generateMathCaptcha } from './utilities/generateMathCaptcha.js'

import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'

const PORT = process.env.PORT || 8000
const __dirname = path.resolve()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

app.use(express.json({ limit: '20mb' })) // allows us to parse incoming requests:req.body
app.use(cookieParser()) // allows us to parse incoming cookies

app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
  })
}

// Store CAPTCHA challenges and their solutions with timestamps
let captchas = []

const captchaExpirationTime = 300000 // 5 minutes

// Middleware to verify CAPTCHA token and expiration
const verifyCaptchaToken = (req, res, next) => {
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

// Route to generate CAPTCHA challenges and return the CAPTCHA challenge
app.post('/generate-captcha', (req, res) => {
  const captchaToken = req.body.captchaToken
  if (!captchaToken) {
    res.status(401).json({ succes: false, message: 'captchaToken is required' })
    return
  }
  const timestamp = req.body.timestamp
  // Your CAPTCHA generation logic
  const { challenge, solution } = generateMathCaptcha()
  captchas.push({ token: captchaToken, solution, timestamp })
  res.json({ challenge })
})

 // Route to validate CAPTCHA using the CAPTCHA token and timestamp
app.post('/validate-captcha', verifyCaptchaToken, (req, res) => {
  const userCaptchaInput = req.body.captchaInput
  const captchaToken = req.body.captchaToken
  const { solution } = req.captcha
  if (userCaptchaInput === solution) {
    captchas = captchas.filter((item) => item.token !== captchaToken)
    res.json({ message: 'CAPTCHA validated successfully!' })
  } else {
    res.status(400).json({ message: 'CAPTCHA validation failed' })
  }
})

// const sendEmail = () => {
//   return new Promise((resolve, reject) => {
//     var transporter = createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD_APP_EMAIL,
//       },
//     })

//     const mail_configs = {
//       from: 'kurt.hogen99@gmail.com',
//       to: 'kurt.ah@outlook.com',
//       subject: 'Woof Meetup Password Reset',
//       html: `<!DOCTYPE html>
//       <html lang="en" >
//       <head>
//         <meta charset="UTF-8">
//         <title>Woof Meetup Password Reset</title>

//       </head>
//       <body>
//       <!-- partial:index.partial.html -->
//       <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
//         <div style="margin:50px auto;width:70%;padding:20px 0">
//           <div style="border-bottom:1px solid #eee">
//             <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Reset Your Password</a>
//           </div>
//           <p style="font-size:1.1em">Woof!,</p>
//           <p>Please use the link to reset your password. Link is valid for 5 minutes</p>
//           <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"></h2>
//           <p style="font-size:0.9em;">Thank you and remember to wag right!,<br />Woof Meetup!/p>
//           <hr style="border:none;border-top:1px solid #eee" />
//           <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
//             <p>Woof Meetup/p>
//             <p>Salt Lake City, UT</p>
//           </div>
//         </div>
//       </div>
//       <!-- partial -->

//       </body>
//       </html>`,
//     }
//     transporter.sendMail(mail_configs, (error, info) => {
//       if (error) {
//         console.log(error)
//         reject({ message: 'An error has occured' })
//       }
//       resolve({ message: 'Email sent successfully' })
//     })
//   })
// }

// app.get('/signup', (req, res) => {
//   sendEmail()
//     .then((response) => res.send(response.message))
//     .catch((error) => res.status(500).send(error.message))
// })

server.listen(PORT, () => {
  connectDB()
  console.log('Server is running on port: ', PORT)
})

import 'dotenv/config'
import { app, server } from './lib/socket.js'
import express from 'express'
import cors from 'cors'
import { connectDB } from './db/connectDB.js'
import path from 'path'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'

const PORT = process.env.PORT || 8000
const __dirname = path.resolve()
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://woofmeetup.com', 'https://www.woofmeetup.com']
        : ['http://localhost:5173'],
    credentials: true,
  })
)

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

// Cloudflare Turnstile verification endpoint
app.post('/verify-turnstile', async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: 'No token provided' })
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    )

    const data = await response.json()

    if (data.success) {
      res.json({ success: true, message: 'Turnstile verification successful' })
    } else {
      res.status(400).json({
        success: false,
        message: 'Turnstile verification failed',
        errors: data['error-codes'],
      })
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
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

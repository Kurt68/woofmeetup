import { MailtrapClient } from 'mailtrap'
import dotenv from 'dotenv'

dotenv.config()

// Use Sending API in production, Testing API in development
const isProduction = process.env.NODE_ENV === 'production'
const useSendingAPI =
  process.env.USE_MAILTRAP_SENDING === 'true' || isProduction

export const mailtrapClient = new MailtrapClient({
  endpoint: useSendingAPI ? process.env.MAILTRAP_ENDPOINT : undefined,
  token: useSendingAPI
    ? process.env.MAILTRAP_SENDING_TOKEN
    : process.env.MAILTRAP_TOKEN,
})

// Tailored sender objects for different email types
export const senders = {
  verification: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - Verify Email',
  },
  welcome: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup Welcome',
  },
  passwordReset: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - Security',
  },
  subscription: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - Subscriptions',
  },
  accountDeletion: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - Account Support',
  },
  creditsPurchase: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - Billing',
  },
  likeNotification: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - New Like',
  },
  matchNotification: {
    email: 'hello@woofmeetup.com',
    name: 'Woof Meetup - New Match',
  },
}

// Legacy export for backward compatibility
export const sender = senders.welcome

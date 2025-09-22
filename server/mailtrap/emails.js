import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from './emailTemplates.js'
import { mailtrapClient, sender } from './mailtrap.config.js'

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }]

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Verify your email',
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        '{verificationCode}',
        verificationToken
      ),
      category: 'Email Verification',
    })

    console.log('Email sent successfully', response)
  } catch (error) {
    console.error(`Error sending verification`, error)

    throw new Error(`Error sending verification email: ${error}`)
  }
}

export const sendWelcomeEmail = async (email, userName) => {
  const recipient = [{ email }]

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      template_uuid: 'adb08bc7-8995-4a9c-8617-ccf679a92c12',
      template_variables: {
        name: userName,
        company_info_name: 'Woof Meetup',
        company_info_address: '218 E Ramona Ave',
        company_info_city: 'Salt Lake City, UT',
        company_info_zip_code: '84115',
        company_info_country: 'USA',
      },
    })

    console.log('Welcome email sent successfully', response)
  } catch (error) {
    console.error(`Error sending welcome email`, error)

    throw new Error(`Error sending welcome email: ${error}`)
  }
}

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }]

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Reset your password',
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', resetURL),
      category: 'Password Reset',
    })
  } catch (error) {
    console.error(`Error sending password reset email`, error)

    throw new Error(`Error sending password reset email: ${error}`)
  }
}

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }]

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Password Reset Successful',
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: 'Password Reset',
    })

    console.log('Password reset email sent successfully', response)
  } catch (error) {
    console.error(`Error sending password reset success email`, error)

    throw new Error(`Error sending password reset success email: ${error}`)
  }
}

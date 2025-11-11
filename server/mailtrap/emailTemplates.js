export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">Verify Your Email</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello,</p>
    <p>Thank you for signing up on Woof Meetup! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000000; background-color: #F9F9F9; padding: 15px 25px; display: inline-block; border-radius: 8px;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>Woof Meetup</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
      <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello,</p>
    <p>We're writing to confirm that your password has been successfully reset on Woof Meetup.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #000000; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>If you did not initiate this password reset, please contact our support team immediately.</p>
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication if available</li>
      <li>Avoid using the same password across multiple sites</li>
    </ul>
    <p>Thank you for helping us keep your account secure.</p>
    <p>Best regards,<br>Woof Meetup</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">Password Reset</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello,</p>
    <p>We received a request to reset your password on Woof Meetup. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #000000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>Woof Meetup</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

export const SUBSCRIPTION_WELCOME_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {planName}!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
    <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">🎉 Welcome to {planName}!</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello {userName},</p>
    <p>Thank you for subscribing to <strong>{planName}</strong>! We're thrilled to have you as part of our premium community.</p>
    
    <div style="background-color: #F9F9F9; padding: 20px;">
      <h2 style="color: #000000; margin-top: 0;">Your Premium Benefits:</h2>
      <ul style="line-height: 1.8; padding-left: 20px;">
        <li><strong>Unlimited Messages</strong> - Connect with as many dog owners as you'd like!</li>
        <li><strong>Priority Support</strong> - Get help whenever you need it</li>
        <li><strong>Exclusive Features</strong> - Access to premium-only features as we release them</li>
        <li><strong>Ad-Free Experience</strong> - Enjoy Woof Meetup without interruptions</li>
      </ul>
    </div>

    <p>Your subscription is now active and you can start enjoying all the benefits right away!</p>

    <p style="color: #666; margin-top: 30px;">If you have any questions or need assistance, contact us at <a href="mailto:woofmeetup@outlook.com" style="color: #000000;">woofmeetup@outlook.com</a></p>
    
    <p style="margin-top: 30px;">Happy meetup!<br>The Woof Meetup Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

export const ACCOUNT_DELETION_SCHEDULED_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion - Woof Meetup</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
     <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">Account Deletion {deletionType}</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello {userName},</p>
    <p>We've received your request to delete your Woof Meetup account. We're sorry to see you go!</p>
    
    <div style="background-color: #FFFBEE; padding: 20px;">
      <h2 style="color: #856404; margin-top: 0;">Important Information</h2>
      {dateInfo}{dynamicInfo}
    </div>

    <div style="background-color: #F9F9F9; padding: 20px;">
      <h3 style="color: #000000; margin-top: 0;">What happens when your account is deleted:</h3>
      <ul style="line-height: 1.8; padding-left: 20px;">
        <li>All your profile information will be permanently removed</li>
        <li>Your messages and matches will be deleted</li>
        <li>You will no longer be visible to other users</li>
        <li>This action cannot be undone</li>
        {dynamicList}
      </ul>
    </div>

    <p style="color: #666; margin-top: 30px;">We'd love to hear your feedback about why you're leaving. If you have any questions or concerns, contact us at <a href="mailto:woofmeetup@outlook.com" style="color: #000000;">woofmeetup@outlook.com</a></p>
    
    <p style="margin-top: 30px;">Thank you for being part of Woof Meetup.<br>The Woof Meetup Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

export const CREDITS_PURCHASE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <div style="text-align: center; margin-bottom: 15px;">
      <img src="cid:logo" alt="Woof Meetup Logo" style="width: 350px; height: auto;">
    <h1 style="color: #000000; margin: 10px 0 0 0; font-size: 24px;">💳 Purchase Confirmed!</h1>
  </div>
  <div style="background-color: #ffffff; padding: 10px 0 20px 0;">
    <p style="margin-top: 0;">Hello {userName},</p>
    <p>Thank you for your purchase! Your message credits have been added to your account.</p>
    
    <div style="background-color:#F9F9F9; padding: 20px;">
      <h2 style="color: #000000; margin-top: 0;">Purchase Details:</h2>
      <p style="margin: 10px 0; font-size: 15px;"><strong>Credits Purchased:</strong> {credits}</p>
      <p style="margin: 10px 0; font-size: 15px;"><strong>New Balance:</strong> {newBalance} message credits</p>
      <p style="margin: 10px 0; font-size: 15px;"><strong>Amount Paid:</strong> {amount}</p>
        <h3 style="color: #000000; margin-top: 0;">✓ Your credits are ready to use!</h3>
      <p style="margin: 10px 0;">Start connecting with other dog owners and arrange play dates for your furry friends.</p>
    </div>



    <p style="color: #666; margin-top: 30px;">If you have any questions about your purchase, contact us at <a href="mailto:woofmeetup@outlook.com" style="color: #000000;">woofmeetup@outlook.com</a></p>
    
    <p style="margin-top: 30px;">Happy meetup!<br>The Woof Meetup Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p style="margin-top: 10px;">&copy; woofmeetup.com | 218 E Ramona Ave, Salt Lake City, UT 84115</p>
  </div>
</body>
</html>
`

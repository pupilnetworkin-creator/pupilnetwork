import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// IMPORTANT: Resend does NOT allow Gmail as a from address.
// Free plan: use "onboarding@resend.dev" (only sends to your verified email)
// Paid plan: add & verify your own domain at resend.com/domains
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'PupilNetwork <onboarding@resend.dev>'

export async function sendPremiumEmail({
  email,
  code,
}: {
  email: string
  code: string
}) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: '⭐ Your PupilNetwork Premium Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">🎓 PupilNetwork</h1>
          <p style="color: #6b7280; margin: 8px 0 0;">Your study home</p>
        </div>
        
        <h2 style="color: #111827; font-size: 22px;">Welcome to Premium! ⭐</h2>
        <p style="color: #374151; line-height: 1.6;">Your payment has been received. Here is your premium activation code:</p>
        
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; padding: 32px; text-align: center; margin: 28px 0;">
          <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Your Premium Code</p>
          <span style="font-size: 30px; font-weight: 700; letter-spacing: 6px; color: #ffffff; font-family: monospace;">${code}</span>
        </div>
        
        <p style="color: #374151; font-weight: 600;">How to activate:</p>
        <ol style="color: #374151; line-height: 2;">
          <li>Go to <a href="https://pupilnetwork.is-a.dev/premium" style="color: #6366f1;">pupilnetwork.is-a.dev/premium</a></li>
          <li>Click "Redeem Code"</li>
          <li>Enter the code above</li>
          <li>Enjoy unlimited access for 30 days! 🚀</li>
        </ol>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-top: 24px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">✅ Unlimited AI questions &nbsp;|&nbsp; ✅ Video calls &nbsp;|&nbsp; ✅ Unlimited rooms</p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.6;">
          If you didn't request this, please ignore this email.<br>
          Code is valid for 30 days from activation date.
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: '👋 Welcome to PupilNetwork!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">🎓 PupilNetwork</h1>
        </div>
        
        <h2 style="color: #111827;">Hey ${name}! Welcome aboard 🎉</h2>
        <p style="color: #374151; line-height: 1.6;">PupilNetwork is now your study home. Here's what you can do right away:</p>
        
        <div style="margin: 24px 0;">
          <div style="padding: 16px; border-left: 4px solid #6366f1; background: #f5f3ff; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
            <p style="margin: 0; color: #374151;">💬 <strong>Join live study rooms</strong> by subject — chat with classmates in real time</p>
          </div>
          <div style="padding: 16px; border-left: 4px solid #6366f1; background: #f5f3ff; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
            <p style="margin: 0; color: #374151;">❓ <strong>Post questions</strong> and earn points for helping others on the Q&A board</p>
          </div>
          <div style="padding: 16px; border-left: 4px solid #6366f1; background: #f5f3ff; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
            <p style="margin: 0; color: #374151;">🤖 <strong>Ask the AI Study Buddy</strong> anything — 5 free questions per hour</p>
          </div>
          <div style="padding: 16px; border-left: 4px solid #6366f1; background: #f5f3ff; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #374151;">🏆 <strong>Climb the leaderboard</strong> and become a top helper in your subject</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://pupilnetwork.is-a.dev/dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Go to my dashboard →
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; text-align: center;">
          Built with ❤️ by a first-year student | India 🇮🇳
        </p>
      </div>
    `,
  })
}

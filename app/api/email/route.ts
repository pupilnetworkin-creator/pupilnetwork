import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, email, name } = body

    if (type === 'welcome') {
      await sendWelcomeEmail({ email, name })
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Invalid email type' }, { status: 400 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

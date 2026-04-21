import { nanoid } from 'nanoid'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPremiumEmail } from '@/lib/resend'

// The from address MUST be: onboarding@resend.dev (free) or your verified domain
// Gmail addresses are NOT allowed by Resend

export async function POST(req: Request) {
  try {
    const { email, utrNumber } = await req.json()

    if (!email || !utrNumber || utrNumber.length < 10) {
      return Response.json({ error: 'Invalid email or UTR number' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // 1. Check if UTR is already used
    const { data: existingCode } = await adminSupabase
      .from('premium_codes')
      .select('id')
      .eq('utr_number', utrNumber)
      .single()

    if (existingCode) {
      return Response.json({ 
        error: 'This UTR number has already been used to claim a premium code.' 
      }, { status: 409 })
    }

    // 2. Generate a unique code (e.g. PUPIL-ABCD-WXYZ)
    const segment1 = nanoid(4).toUpperCase()
    const segment2 = nanoid(4).toUpperCase()
    const code = `PUPIL-${segment1}-${segment2}`

    // 3. Insert into DB (using admin client to bypass RLS)
    const { error: insertError } = await adminSupabase
      .from('premium_codes')
      .insert({
        code,
        email,
        utr_number: utrNumber,
        status: 'active'
      })

    if (insertError) {
      console.error('Code insert error:', insertError)
      return Response.json({ error: 'Database error while generating code' }, { status: 500 })
    }

    // 4. Send email - await it so we can catch and log errors
    try {
      await sendPremiumEmail({ email, code })
    } catch (emailErr: any) {
      // Log the error but still return the code to the user
      console.error('Email sending failed:', emailErr?.message || emailErr)
    }

    return Response.json({ code, success: true })

  } catch (error: any) {
    console.error('Claim Error:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

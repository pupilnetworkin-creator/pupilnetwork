import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Please provide a valid code.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()

    const adminSupabase = createAdminClient()

    // 1. Find the code
    const { data: premiumCode, error: queryError } = await adminSupabase
      .from('premium_codes')
      .select('*')
      .eq('code', cleanCode)
      .eq('status', 'active')
      .is('used_by', null)
      .single()

    if (queryError || !premiumCode) {
      return Response.json({ 
        error: 'Invalid code, or code has already been used/revoked.' 
      }, { status: 404 })
    }

    // 2. Mark code as used
    const { error: updateCodeError } = await adminSupabase
      .from('premium_codes')
      .update({
        status: 'used',
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', premiumCode.id)

    if (updateCodeError) throw updateCodeError

    // 3. Grant premium status for 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: updateUserError } = await adminSupabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id)

    if (updateUserError) throw updateUserError

    return Response.json({ success: true, message: 'Premium activated successfully!' })

  } catch (error: any) {
    console.error('Verify Error:', error)
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

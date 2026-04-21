import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { codeId, adminSecret } = await req.json()

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return Response.json({ error: 'Unauthorized: Invalid Admin Secret' }, { status: 403 })
    }

    if (!codeId) {
      return Response.json({ error: 'Missing codeId' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // 1. Get the code to see if someone used it
    const { data: codeData } = await adminSupabase
      .from('premium_codes')
      .select('used_by')
      .eq('id', codeId)
      .single()

    // 2. Mark the code as revoked
    const { error: revokeError } = await adminSupabase
      .from('premium_codes')
      .update({ status: 'revoked' })
      .eq('id', codeId)

    if (revokeError) throw revokeError

    // 3. If someone used it, strip their premium status
    if (codeData?.used_by) {
      await adminSupabase
        .from('profiles')
        .update({ is_premium: false, premium_expires_at: null })
        .eq('id', codeData.used_by)
    }

    return Response.json({ success: true })

  } catch (error: any) {
    console.error('Revoke Error:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'
  const siteUrl = getURL()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
    
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${siteUrl}/login?error=No+code+provided`)
}

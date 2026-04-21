import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIChatWindow } from '@/components/ai/AIChatWindow'

export default async function AIBuddyPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const initialQuery = searchParams.q
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.is_premium || false

  // Get usage count
  let usageCount = 0
  if (!isPremium) {
    const fiveHoursAgo = new Date(Date.now() - 18000000).toISOString()
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .gte('window_start', fiveHoursAgo)
      .single()

    usageCount = usage?.count || 0
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto w-full -mt-4">
      {/* Header */}
      <div className="py-4 shrink-0 px-2 lg:px-0">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          AI Study Buddy
        </h1>
        <p className="text-slate-500 mt-1">
          Powered by Groq · Llama 3.1. Fast, accurate, and available 24/7.
        </p>
      </div>

      {/* Chat Window */}
      <div className="flex-1 min-h-0 bg-slate-50 p-2 lg:p-0 rounded-2xl">
        <AIChatWindow 
          initialQuery={initialQuery} 
          isPremium={isPremium} 
          usageCount={usageCount}
        />
      </div>
    </div>
  )
}

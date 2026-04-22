import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIChatWindow } from '@/components/ai/AIChatWindow'
import { Sparkles } from 'lucide-react'

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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto w-full group px-2 lg:px-0">
      {/* Header Section */}
      <div className="py-6 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <Sparkles className="w-3 h-3" /> Neural Network v2.1
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AI Study Buddy
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Powered by <span className="text-indigo-600 dark:text-indigo-400 font-bold">Llama 3.1</span> · Instant concepts, code, and explanations.
          </p>
        </div>
        
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Processing Engine</div>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-foreground">Groq Ultra-Fast API</span>
          </div>
        </div>
      </div>

      {/* Chat Window Container */}
      <div className="flex-1 min-h-0 glass-card rounded-[2.5rem] overflow-hidden flex flex-col transition-all group-hover:border-indigo-500/20">
        <AIChatWindow 
          initialQuery={initialQuery} 
          isPremium={isPremium} 
          usageCount={usageCount}
        />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai'
import { createHash } from 'crypto'
import connectDB, { AIConversation } from '@/lib/mongodb'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, history = [] } = await req.json()

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // 1. Check rate limit & premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.is_premium

    if (!isPremium) {
      const fiveHoursAgo = new Date(Date.now() - 18000000).toISOString()
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('window_start', fiveHoursAgo)
        .single()

      if (usage && usage.count >= 5) {
        return Response.json({
          error: 'rate_limit',
          message: 'You have used your 5 free AI questions for this 5-hour window. Upgrade to Premium for unlimited access!'
        }, { status: 429 })
      }

      // Increment usage
      if (usage) {
        await supabase.from('ai_usage').update({ count: usage.count + 1 }).eq('id', usage.id)
      } else {
        await supabase.from('ai_usage').insert({
          user_id: user.id,
          count: 1,
          window_start: new Date().toISOString()
        })
      }
    }

    // 2. Check cache
    const promptHash = createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex')
    const adminSupabase = createAdminClient()
    const { data: cached } = await adminSupabase
      .from('ai_cache')
      .select('response')
      .eq('prompt_hash', promptHash)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .single()

    let responseText = ''
    let isCached = false

    if (cached) {
      responseText = cached.response
      isCached = true
    } else {
      // 3. Call Groq AI
      try {
        responseText = await callAI(prompt, history)
      } catch (aiError: any) {
        console.error('AI call failed:', aiError?.message || aiError)
        // Refund usage for free users
        if (!isPremium) {
          const { data: usage } = await supabase
            .from('ai_usage')
            .select('*')
            .eq('user_id', user.id)
            .gte('window_start', new Date(Date.now() - 18000000).toISOString())
            .single()
          if (usage && usage.count > 0) {
            await supabase.from('ai_usage').update({ count: usage.count - 1 }).eq('id', usage.id)
          }
        }
        return Response.json({ error: 'AI unavailable at the moment. Please try again in a few seconds.' }, { status: 503 })
      }

      // Cache the result
      if (responseText) {
        await adminSupabase.from('ai_cache').upsert(
          { prompt_hash: promptHash, response: responseText },
          { onConflict: 'prompt_hash' }
        )
      }
    }

    // 4. Save to MongoDB in background (non-blocking)
    connectDB().then(async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let conversation = await AIConversation.findOne({
          userId: user.id,
          createdAt: { $gte: today }
        })
        if (!conversation) {
          conversation = new AIConversation({ userId: user.id })
          conversation.messages = history.map((msg: any) => ({ role: msg.role, content: msg.content }))
        }
        conversation.messages.push({ role: 'user', content: prompt })
        if (responseText) conversation.messages.push({ role: 'assistant', content: responseText })
        conversation.updatedAt = new Date()
        await conversation.save()
      } catch (dbError) {
        console.error('MongoDB save failed:', dbError)
      }
    }).catch(err => console.error('MongoDB connect failed:', err))

    return Response.json({ response: responseText, cached: isCached })

  } catch (error: any) {
    console.error('AI Route Error:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

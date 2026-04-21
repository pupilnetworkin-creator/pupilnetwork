'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useIsPremium() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsPremium(false)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()

      setIsPremium(data?.is_premium || false)
      setLoading(false)
    }

    checkPremium()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPremium()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { isPremium, loading }
}

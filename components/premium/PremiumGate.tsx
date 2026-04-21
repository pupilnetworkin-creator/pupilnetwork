'use client'

import { useIsPremium } from '@/hooks/useIsPremium'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles } from 'lucide-react'

interface PremiumGateProps {
  feature: string
  children: React.ReactNode
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const { isPremium, loading } = useIsPremium()

  // During loading, show the content to avoid flicker, or a skeleton
  if (loading) {
    return <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
  }

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200">
      <div className="absolute inset-0 blur-md pointer-events-none opacity-40 select-none grayscale transition-all duration-500">
        <div className="w-full h-full bg-slate-100 flex items-center justify-center p-8 text-center text-slate-300 pointer-events-none">
          [ Content Hidden ]
        </div>
      </div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Crown className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Premium Feature
        </h3>
        <p className="text-slate-600 mb-6 max-w-sm">
          Unlock <strong>{feature}</strong> and supercharge your study sessions.
        </p>
        <Link href="/premium">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2 font-semibold px-6 h-11">
            <Sparkles className="w-4 h-4" /> Upgrade to Premium — ₹99
          </Button>
        </Link>
      </div>
    </div>
  )
}

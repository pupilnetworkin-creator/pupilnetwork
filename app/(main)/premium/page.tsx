'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UPIPaymentFlow } from '@/components/premium/UPIPaymentFlow'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Crown, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useIsPremium } from '@/hooks/useIsPremium'

export default function PremiumPage() {
  const router = useRouter()
  const { isPremium, loading: checkingPremium } = useIsPremium()
  
  // Redeem state
  const [codeToRedeem, setCodeToRedeem] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  // From environment
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'yourname@upi'
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || 'PupilNetwork'
  const price = parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE || '99')

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeToRedeem.trim()) return

    setRedeeming(true)

    try {
      const res = await fetch('/api/premium/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRedeem })
      })

      const data = await res.json()

      if (!res.ok) {
         toast.error(data.error || 'Failed to verify code')
         setRedeeming(false)
         return
      }

      // Fire confetti and show success
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        })
      })

      toast.success('Premium Activated! You are now a ⭐ Member.')
      router.refresh()
      
      // We don't stop loading so the UI transitions to the Active Premium View
      
    } catch (err) {
      toast.error('Network error while verifying code.')
      setRedeeming(false)
    }
  }

  if (checkingPremium) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // ALREADY PREMIUM VIEW
  if (isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
        <Card className="border-indigo-200 dark:border-indigo-900/50 shadow-xl overflow-hidden relative bg-card transition-colors">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/30 dark:ring-indigo-900/10">
              <Crown className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <Badge className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 border-green-200 dark:border-green-900/50 mb-4 px-3 py-1 font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1.5 inline" /> Premium Active
            </Badge>

            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              You're a Premium Member ⭐
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
              Thanks for supporting PupilNetwork! Your account is fully unlocked.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left mb-8">
              <div className="bg-muted/50 rounded-xl p-4 border border-border flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                 <div><p className="font-semibold text-foreground text-sm">Unlimited Rooms</p><p className="text-xs text-muted-foreground">Create & join without limits</p></div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 border border-border flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                 <div><p className="font-semibold text-foreground text-sm">Live Video Calls</p><p className="text-xs text-muted-foreground">Unlocked in all study rooms</p></div>
              </div>
              <div className="col-span-1 sm:col-span-2 bg-muted/50 rounded-xl p-4 border border-border flex items-start gap-3">
                 <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                 <div><p className="font-semibold text-foreground text-sm">Priority AI Study Buddy</p><p className="text-xs text-muted-foreground">Ask unlimited questions without rate limits</p></div>
              </div>
            </div>

            <Button onClick={() => router.push('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-8">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // NOT PREMIUM BUY VIEW
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <div className="text-center px-4 pt-8">
        <Badge className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 hover:bg-indigo-100 border-none mb-4 tracking-widest uppercase font-bold py-1">
          Support the Project
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Upgrade to Premium ⭐
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock the full power of PupilNetwork for the price of a coffee. 
          Your contribution keeps server costs at ₹0 for other students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 px-4">
        
        {/* Left: What you get */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-indigo-600 dark:bg-indigo-700/80 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden transition-colors">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Crown className="w-6 h-6" /> For ₹{price}/month
            </h3>
            
            <ul className="space-y-4">
              {[
                'Unlimited live video calls',
                'Unlimited AI Study Buddy questions',
                'Join unlimited study rooms',
                'Premium Gold Badge on profile',
                'Support student-built software'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 pt-6 border-t border-indigo-500/50">
              <div className="flex items-center gap-2 text-indigo-200 text-sm">
                <AlertCircle className="w-4 h-4" /> Valid for 30 days. No auto-renewal.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Flow & Redeem */}
        <div className="lg:col-span-3 space-y-8">
          
          <UPIPaymentFlow upiId={upiId} name={upiName} amount={price} />

          {/* Section Divider */}
          <div id="redeem-section" className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                Already paid?
              </span>
            </div>
          </div>

          {/* Redeem Code Block */}
          <Card className="border-border shadow-sm relative overflow-hidden bg-card transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500" />
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-foreground mb-2">Redeem Premium Code</h3>
              <p className="text-muted-foreground text-sm mb-6">Received a code? Enter it below to unlock premium instantly.</p>
              
              <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    value={codeToRedeem}
                    onChange={(e) => setCodeToRedeem(e.target.value.toUpperCase())}
                    placeholder="e.g. PUPIL-XXXX-XXXX"
                    className="font-mono text-center tracking-[0.2em] sm:text-left h-12 uppercase focus-visible:ring-indigo-500 border-border bg-muted/30 text-foreground"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={redeeming || !codeToRedeem}
                  className="bg-indigo-900 hover:bg-slate-900 text-white h-12 px-8 shadow-md"
                >
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Redeem
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

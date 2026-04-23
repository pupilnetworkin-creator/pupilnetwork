'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RoomTimerProps {
  roomId: string
  expiresAt: string | null
  onExpire?: () => void
}

export function RoomTimer({ roomId, expiresAt, onExpire }: RoomTimerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setTimeLeft('Expired')
        setIsExpired(true)
        clearInterval(interval)
        
        // Deactivate room and kick out
        handleExpiration()
        return
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      // Urgent if less than 5 minutes
      if (difference < 5 * 60 * 1000) {
        setIsUrgent(true)
      }

      let timeString = ''
      if (hours > 0) timeString += `${hours}h `
      timeString += `${minutes}m ${seconds}s`
      
      setTimeLeft(timeString)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpire, roomId])

  async function handleExpiration() {
    // 1. Mark as inactive in DB (so it doesn't show in lists)
    await supabase.from('rooms').update({ is_active: false }).eq('id', roomId)
    
    // 2. Notify and redirect
    toast.error('Session expired. Redirecting...', {
      description: 'This study room has reached its time limit.'
    })
    
    if (onExpire) onExpire()
    
    setTimeout(() => {
      router.push('/rooms')
    }, 2000)
  }

  if (!expiresAt) return null

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1.5 py-1 px-3 border transition-colors ${
          isExpired 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : isUrgent 
              ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        {isExpired || isUrgent ? (
          <AlertCircle className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
        ) : (
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className="font-mono text-xs font-bold leading-none">
          {isExpired ? 'SESSION ENDED' : timeLeft}
        </span>
      </Badge>
    </div>
  )
}

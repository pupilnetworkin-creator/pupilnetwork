'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PendingRequest {
  id: string
  sender: {
    id: string
    display_name: string
    avatar_color: string
    username: string
  }
}

export function PendingRequestList({ requests }: { requests: any[] }) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  async function handleAction(requestId: string, action: 'accept' | 'reject') {
    setLoadingIds(prev => new Set(prev).add(requestId))
    
    let error
    if (action === 'accept') {
      const { error: err } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId)
      error = err
    } else {
      const { error: err } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)
      error = err
    }

    if (error) {
      toast.error(`Could not ${action} request`)
    } else {
      toast.success(action === 'accept' ? 'Connection accepted!' : 'Request removed')
      router.refresh()
    }
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(requestId)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-right-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-indigo-50">
              <AvatarFallback style={{ backgroundColor: req.sender.avatar_color, color: 'white', fontWeight: 'bold' }}>
                {getInitials(req.sender.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-none mb-0.5">{req.sender.display_name}</span>
              <span className="text-[10px] text-slate-400 font-medium">@{req.sender.username}</span>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
              disabled={loadingIds.has(req.id)}
              onClick={() => handleAction(req.id, 'reject')}
              title="Reject"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs"
              disabled={loadingIds.has(req.id)}
              onClick={() => handleAction(req.id, 'accept')}
            >
              {loadingIds.has(req.id) ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Accept'
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

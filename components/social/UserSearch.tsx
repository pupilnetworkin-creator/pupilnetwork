'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus, Check, Loader2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_color')
      .ilike('display_name', `%${query}%`)
      .not('id', 'eq', currentUserId)
      .limit(5)

    if (error) {
      toast.error('Search failed')
    } else {
      setResults(data || [])
    }
    setSearching(false)
  }

  async function sendRequest(receiverId: string) {
    setPendingIds(prev => new Set(prev).add(receiverId))
    
    const { error } = await supabase
      .from('friendships')
      .insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        status: 'pending'
      })

    if (error) {
       console.error('Friendship request error:', error)
       // Check if already exists
       if (error.code === '23505') {
         toast.info('Request already pending or you are already friends.')
       } else {
         toast.error(`Error: ${error.message || 'Could not send request'}`)
       }
    } else {
      toast.success('Connection request sent!')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <div className="flex gap-2">
          <Input 
            placeholder="Search students by name..." 
            className="pl-9 bg-white border-slate-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={searching} className="bg-indigo-600 hover:bg-indigo-700">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 divide-y overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
          {results.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback style={{ backgroundColor: user.avatar_color, color: 'white' }}>
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{user.display_name}</h4>
                  <p className="text-xs text-slate-500">@{user.username}</p>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant={pendingIds.has(user.id) ? "outline" : "default"}
                disabled={pendingIds.has(user.id)}
                onClick={() => sendRequest(user.id)}
                className={pendingIds.has(user.id) ? "bg-slate-50" : "bg-indigo-600 hover:bg-indigo-700"}
              >
                {pendingIds.has(user.id) ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Requested
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" /> Connect
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { getInitials, timeAgo } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    display_name: string
    avatar_color: string
    username: string
  }
}

interface ChatWindowProps {
  roomId: string
}

export function ChatWindow({ roomId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; avatar_color: string; username: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let active = true

    // 1. Fetch initial messages (async, safe)
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, user_id,
          profiles(display_name, avatar_color, username)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (active && data) {
        // @ts-ignore - Supabase join typing issue
        setMessages(data)
        setLoading(false)
      }
    }

    // 2. Get current user + profile (async, safe)
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active || !user) return
      setUser(user)
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_color, username')
        .eq('id', user.id)
        .single()
      if (active && prof) setProfile(prof)
    }

    fetchMessages()
    fetchUser()

    // 3. Set up Realtime channel SYNCHRONOUSLY (before subscribe)
    const channel = supabase
      .channel(`realtime:room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the profile for the new message since Postgres changes don't include joins
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_color, username')
            .eq('id', payload.new.user_id)
            .single()

          const completeMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            profiles: profile as any,
          }

          if (active) {
            setMessages((prev) => [...prev, completeMessage])
          }
        }
      )
      .subscribe()

    // 4. Cleanup: remove channel on unmount
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update — show message immediately without waiting for Realtime
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: profile ?? { display_name: 'You', avatar_color: '#6366f1', username: '' },
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: user.id,
      content,
    })

    if (error) {
      // Rollback optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading chat history...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-10">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <p className="font-medium text-slate-600 mb-1">Welcome to the room!</p>
            <p>Say hi to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === user?.id
            const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="shrink-0 w-8">
                  {showAvatar ? (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback 
                        style={{ backgroundColor: msg.profiles?.avatar_color || '#cbd5e1', color: 'white', fontSize: '11px' }}
                      >
                        {getInitials(msg.profiles?.display_name || '?')}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {isMe ? 'You' : msg.profiles?.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <div 
                    className={`px-4 py-2 rounded-2xl text-[15px] leading-relaxed break-words shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full pl-4 pr-12 bg-white focus-visible:ring-indigo-500 shadow-sm border-slate-200"
            disabled={!user || sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || sending}
            className="absolute right-1 top-1 bottom-1 h-auto rounded-full w-9 bg-indigo-600 hover:bg-indigo-700 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {!user && (
          <p className="text-xs text-center text-slate-500 mt-2">
            You must be logged in to chat.
          </p>
        )}
      </div>
    </div>
  )
}

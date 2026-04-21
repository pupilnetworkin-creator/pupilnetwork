'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  profiles: {
    display_name: string
    avatar_color: string
    username: string
  }
}

interface DirectChatProps {
  friendId: string
  currentUserId: string
  friendProfile: {
    display_name: string
    avatar_color: string
    username: string
  }
}

export function DirectChat({ friendId, currentUserId, friendProfile }: DirectChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<{ display_name: string; avatar_color: string; username: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let active = true

    async function fetchMessages() {
      const { data } = await supabase
        .from('direct_messages')
        .select(`
          id, content, created_at, sender_id,
          profiles:profiles!direct_messages_sender_id_fkey(display_name, avatar_color, username)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (active && data) {
        setMessages(data as any)
        setLoading(false)
      }
    }

    async function fetchUserProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_color, username')
        .eq('id', currentUserId)
        .single()
      if (active && data) setCurrentUserProfile(data)
    }

    fetchMessages()
    fetchUserProfile()

    // Realtime channel for this specific 1-to-1 conversation
    const channel = supabase
      .channel(`direct_chat:${currentUserId}:${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId}))`
        },
        async (payload) => {
          if (payload.new.sender_id === currentUserId && messages.some(m => m.id === payload.new.id)) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_color, username')
            .eq('id', payload.new.sender_id)
            .single()

          const completeMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            sender_id: payload.new.sender_id,
            profiles: profile as any,
          }

          if (active) {
            setMessages((prev) => [...prev, completeMessage])
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [friendId, currentUserId])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)

    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      profiles: currentUserProfile ?? { display_name: 'You', avatar_color: '#6366f1', username: '' },
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { error } = await supabase.from('direct_messages').insert({
      sender_id: currentUserId,
      receiver_id: friendId,
      content,
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-xl shadow-slate-200/10 dark:shadow-none transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/friends">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
              <AvatarFallback style={{ backgroundColor: friendProfile.avatar_color, color: 'white' }}>
                {getInitials(friendProfile.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm leading-none mb-1">{friendProfile.display_name}</h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active Now</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-10">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-4 rotate-3 group">
              <span className="text-3xl group-hover:scale-125 transition-transform">👋</span>
            </div>
            <p className="font-bold text-foreground mb-1">Start a conversation</p>
            <p>Send a message to {friendProfile.display_name.split(' ')[0]}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed break-words shadow-sm transition-colors ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-muted text-foreground rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-muted/30 border-t border-border transition-colors">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative group">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${friendProfile.display_name.split(' ')[0]}...`}
            className="flex-1 rounded-2xl pl-4 pr-12 bg-background border-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 shadow-inner transition-all text-foreground"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || sending}
            className="absolute right-1 top-1 bottom-1 h-auto rounded-xl w-10 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

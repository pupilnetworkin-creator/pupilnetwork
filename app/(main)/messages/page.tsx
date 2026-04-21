import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials, timeAgo } from '@/lib/utils'
import { MessageSquare, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Friends to chat with
  const { data: friends } = await supabase
    .from('friendships')
    .select(`
      id,
      sender:profiles!friendships_sender_id_fkey(id, display_name, username, avatar_color),
      receiver:profiles!friendships_receiver_id_fkey(id, display_name, username, avatar_color)
    `)
    .or(`and(sender_id.eq.${user.id},status.eq.accepted),and(receiver_id.eq.${user.id},status.eq.accepted)`)

  const conversationList = friends?.map(f => {
    return f.sender.id === user.id ? f.receiver : f.sender
  }) || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Messages
          </h1>
          <p className="text-slate-500 mt-1">Chat privately with your connections.</p>
        </div>
        <Link href="/friends">
          <Button variant="outline" className="gap-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50">
            <Users className="w-4 h-4" /> Find Friends
          </Button>
        </Link>
      </div>

      <Card className="border-slate-100 shadow-xl shadow-slate-200/50 border-2 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Your Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conversationList.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {conversationList.map((friend) => (
                <Link 
                  key={friend.id} 
                  href={`/messages/${friend.id}`}
                  className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                        <AvatarFallback style={{ backgroundColor: friend.avatar_color, color: 'white' }}>
                          {getInitials(friend.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {friend.display_name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">@{friend.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Open Chat</span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MessageSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">No messages yet</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                Once you connect with classmates in study rooms, you can start private chats with them here.
              </p>
              <Link href="/rooms" className="mt-8 inline-block">
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-bold shadow-lg shadow-indigo-200">
                  Join Study Rooms
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 items-start">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">Study Tip</h4>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Collaborating 1-to-1 with friends is one of the most effective ways to master difficult concepts. Use direct messages to schedule peer-tutoring sessions!
          </p>
        </div>
      </div>
    </div>
  )
}

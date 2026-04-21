import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChatWindow } from '@/components/rooms/ChatWindow'
import { JitsiEmbed } from '@/components/rooms/JitsiEmbed'
import { PremiumGate } from '@/components/premium/PremiumGate'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Users, Info, AlertTriangle } from 'lucide-react'
import { RoomTimer } from '@/components/rooms/RoomTimer'
import { SUBJECT_COLORS } from '@/lib/utils'

export default async function RoomPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const roomId = params.id
  const supabase = await createClient()

  // Get user profile for Jitsi display name
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Get Room Details
  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      *,
      creator:profiles!rooms_created_by_fkey(display_name)
    `)
    .eq('id', roomId)
    .single()

  if (error || !room) {
    redirect('/rooms')
  }

  // Increment member count (basic naive approach for now)
  // In a real app we'd use presence, but this works for demo
  try {
    await supabase.rpc('increment_room_members', { row_id: roomId })
  } catch {
    // If RPC fails, ignore silently
  }

  const subjectColor = SUBJECT_COLORS[room.subject] || SUBJECT_COLORS.Other

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-4">
      {/* Room Header */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/rooms">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className={`${subjectColor} border-none text-[10px] uppercase font-bold py-0 h-4`}>
                {room.subject}
              </Badge>
              <div className="flex items-center text-xs text-slate-500 font-medium whitespace-nowrap">
                <Users className="w-3.5 h-3.5 mr-1" />
                {room.member_count + 1} online
              </div>
            </div>
            <h1 className="font-bold text-slate-900 text-lg truncate pr-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {room.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <RoomTimer expiresAt={room.expires_at} />
        
        {room.description && (
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg max-w-sm truncate border border-slate-100">
            <Info className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="truncate">{room.description}</span>
          </div>
        )}
      </div>
    </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden bg-slate-50/50 relative">
        {room.expires_at && new Date(room.expires_at) < new Date() && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Session Expired
            </h2>
            <p className="text-slate-500 max-w-sm mb-6">
              This study session has reached its time limit and is now closed.
            </p>
            <Link href="/rooms">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Back to Study Rooms
              </Button>
            </Link>
          </div>
        )}
        
        {/* Chat Area (Left / Full on mobile) */}
        <div className="flex-1 lg:w-3/5 xl:w-[65%] min-h-0 h-full flex flex-col">
          <ChatWindow roomId={roomId} />
        </div>

        {/* Video Area (Right / Top on mobile) */}
        <div className="h-64 lg:h-full shrink-0 lg:w-2/5 xl:w-[35%] flex flex-col">
          <PremiumGate feature="Live Video Calls">
            <JitsiEmbed roomId={roomId} displayName={profile?.display_name || 'Student'} />
          </PremiumGate>
          <div className="mt-3 text-center lg:text-left text-xs text-slate-400">
            Video powered by Jitsi Meet. Completely secure and encrypted.
          </div>
        </div>

      </div>
    </div>
  )
}

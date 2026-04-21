import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserSearch } from '@/components/social/UserSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { Users, UserPlus, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { PendingRequestList } from '@/components/social/PendingRequestList'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Friends (Accepted friendships)
  const { data: friends } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      sender:profiles!friendships_sender_id_fkey(id, display_name, username, avatar_color),
      receiver:profiles!friendships_receiver_id_fkey(id, display_name, username, avatar_color)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Fetch Pending Requests (Received)
  const { data: receivedRequests } = await supabase
    .from('friendships')
    .select(`
      id,
      sender:profiles!friendships_sender_id_fkey(id, display_name, username, avatar_color)
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  // Process friends list (getting the "other" person)
  const processedFriends = friends?.map(f => {
    const friend = f.sender.id === user.id ? f.receiver : f.sender
    return { ...friend, friendshipId: f.id }
  }) || []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Connections
          </h1>
          <p className="text-slate-500 mt-1">Find and study with your classmates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Search & Requests */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 shadow-sm border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Find Students
              </CardTitle>
              <CardDescription>Search by name or username</CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearch currentUserId={user.id} />
            </CardContent>
          </Card>

          {receivedRequests && receivedRequests.length > 0 && (
             <Card className="border-indigo-100 bg-indigo-50/30">
               <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900 uppercase tracking-wider">
                   <Clock className="w-4 h-4" /> Received Requests
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <PendingRequestList requests={receivedRequests as any} />
               </CardContent>
             </Card>
          )}
        </div>

        {/* Right: Friends Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6">My Friends ({processedFriends.length})</TabsTrigger>
              <TabsTrigger value="online" className="rounded-lg px-6">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {processedFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedFriends.map((friend) => (
                    <Card key={friend.id} className="hover:border-indigo-200 transition-colors group cursor-pointer overflow-hidden border-2 border-slate-100">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback style={{ backgroundColor: friend.avatar_color, color: 'white' }}>
                                {getInitials(friend.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">{friend.display_name}</h4>
                            <p className="text-xs text-slate-500">@{friend.username}</p>
                          </div>
                        </div>
                        <Link href={`/messages/${friend.id}`}>
                           <Button size="icon" variant="ghost" className="rounded-full text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-bold">No connections yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                    Start searching for classmates on the left to build your study network.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="online" className="mt-6">
               <div className="bg-slate-50/50 rounded-3xl p-12 text-center text-slate-500 italic">
                  Social feed coming soon...
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

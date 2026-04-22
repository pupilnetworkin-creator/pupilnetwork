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
  const processedFriends = friends?.map((f: any) => {
    const sender = Array.isArray(f.sender) ? f.sender[0] : f.sender
    const receiver = Array.isArray(f.receiver) ? f.receiver[0] : f.receiver
    const friend = sender.id === user.id ? receiver : sender
    return { ...friend, friendshipId: f.id }
  }) || []

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <Users className="w-3 h-3" /> Student Network
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Connections
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Find and study with your classmates across the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Social Actions */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none bg-card/50 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden border border-white/10">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white">
              <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
                <UserPlus className="w-5 h-5 text-indigo-200" /> Find Students
              </CardTitle>
              <CardDescription className="text-indigo-100/70 font-medium mt-1">Search by name or username</CardDescription>
            </div>
            <CardContent className="p-6">
              <UserSearch currentUserId={user.id} />
            </CardContent>
          </Card>

          {receivedRequests && receivedRequests.length > 0 && (
             <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-[2rem] overflow-hidden">
               <CardHeader className="pb-3 border-b border-indigo-100/50 dark:border-indigo-900/30">
                 <CardTitle className="text-xs font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                   <Clock className="w-4 h-4 animate-pulse" /> Pending Requests
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-4">
                 <PendingRequestList requests={receivedRequests as any} />
               </CardContent>
             </Card>
          )}
        </div>

        {/* Right Column: Friends Grid */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-8 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
              <TabsList className="bg-transparent gap-2 p-0">
                <TabsTrigger value="all" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg shadow-indigo-500/10">
                  Friends ({processedFriends.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg shadow-indigo-500/10">
                  Social Feed
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0 outline-none">
              {processedFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {processedFriends.map((friend) => (
                    <Card key={friend.id} className="hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group cursor-pointer border border-border/50 bg-card/40 backdrop-blur-sm rounded-[2rem] overflow-hidden p-1">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-background shadow-md group-hover:scale-105 transition-transform">
                              <AvatarFallback className="font-black text-sm" style={{ backgroundColor: friend.avatar_color, color: 'white' }}>
                                {getInitials(friend.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full shadow-sm" />
                          </div>
                          <div>
                            <h4 className="font-black text-foreground text-lg leading-tight group-hover:text-indigo-600 transition-colors">{friend.display_name}</h4>
                            <p className="text-xs text-muted-foreground font-bold tracking-tight">@{friend.username}</p>
                          </div>
                        </div>
                        <Link href={`/messages/${friend.id}`}>
                           <Button size="icon" variant="ghost" className="w-12 h-12 rounded-2xl bg-indigo-500/5 hover:bg-indigo-600 hover:text-white transition-all">
                            <MessageCircle className="w-6 h-6" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-2">No connections found</h3>
                  <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
                    Start searching for classmates on the left to build your study network.
                  </p>
                  <Button variant="outline" className="rounded-2xl border-2 font-bold px-8 h-12">Search Now</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0 outline-none">
               <div className="bg-card/50 backdrop-blur-sm rounded-[3rem] p-24 text-center border border-border/50 shadow-inner">
                  <Clock className="w-16 h-16 text-indigo-300 mx-auto mb-6 opacity-20" />
                  <h3 className="text-2xl font-black text-foreground mb-2">Social Feed</h3>
                  <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Architecting the future...</p>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

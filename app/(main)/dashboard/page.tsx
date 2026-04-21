import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Trophy, Users, MessagesSquare, ArrowRight } from 'lucide-react'
import { RoomCard } from '@/components/rooms/RoomCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get AI Usage (fetch stats)
  const fiveHoursAgo = new Date(Date.now() - 18000000).toISOString()
  const { data: aiUsage } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', user.id)
    .gte('window_start', fiveHoursAgo)
    .single()

  // Get recent active rooms
  const { data: recentRooms } = await supabase
    .from('rooms')
    .select(`
      id, name, subject, description, member_count, created_at,
      creator:profiles(display_name)
    `)
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(4)

  // Get recent QA
  const { data: recentQA } = await supabase
    .from('qa_posts')
    .select(`
      id, title, subject, upvotes, answer_count, is_solved, created_at,
      author:profiles(id, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Hey {profile?.display_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Ready to study today?</p>
      </div>

      {/* Quick AI Search Bar */}
      <div className="bg-indigo-600 rounded-2xl p-6 md:p-8 shadow-lg shadow-indigo-200 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-100" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-300" /> Ask the AI Study Buddy
          </h2>
          <form action="/ai-buddy" className="flex gap-3">
            <input 
              name="q"
              type="text" 
              placeholder="Explain quantum entanglement like I'm 5..." 
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            />
            <Button type="submit" variant="secondary" className="px-6 h-auto rounded-xl font-medium">
              Ask AI
            </Button>
          </form>
          <div className="mt-3 text-sm text-indigo-200">
            {profile?.is_premium ? (
              <span className="flex items-center gap-1">⭐ Premium: Unlimited AI questions</span>
            ) : (
              <span>{aiUsage?.count || 0}/5 free AI questions used (5hr cycle).</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-3">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{profile?.points || 0}</div>
            <div className="text-sm font-medium text-muted-foreground">Points Earned</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
              <MessagesSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-sm font-medium text-muted-foreground">Questions Answered</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-sm font-medium text-muted-foreground">Rooms Joined</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-indigo-50/50 to-background border-indigo-100 dark:border-indigo-900/50">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{aiUsage?.count || 0}</div>
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">AI Inquiries (5hr)</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Rooms */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Popular Study Rooms
            </h2>
            <Link href="/rooms" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentRooms && recentRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(recentRooms as any[]).map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="bg-muted border border-border rounded-xl p-8 text-center text-muted-foreground">
              No active rooms right now. <Link href="/rooms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create the first one!</Link>
            </div>
          )}
        </div>

        {/* Recent QA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Recent Questions
            </h2>
            <Link href="/qa" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              Board
            </Link>
          </div>

          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground">Latest Posts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentQA && recentQA.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentQA.map((post) => (
                    <Link href={`/qa/${post.id}`} key={post.id} className="block hover:bg-muted p-4 transition-colors">
                      <div className="flex gap-3">
                        <div className="shrink-0 pt-1">
                          <div className={`w-2 h-2 rounded-full ${post.is_solved ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-tight mb-1">
                            {post.title}
                          </h4>
                          <span className="text-xs font-medium text-muted-foreground">{post.subject}</span>
                          <span className="text-xs text-muted-foreground/60 ml-2">by {(post as any).author?.display_name || 'Unknown'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No questions asked yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

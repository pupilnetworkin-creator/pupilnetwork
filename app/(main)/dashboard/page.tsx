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

  // 2. Fetch all data in parallel for maximum speed
  const fiveHoursAgo = new Date(Date.now() - 18000000).toISOString()
  const [
    { data: profile },
    { data: aiUsage },
    { data: recentRooms },
    { data: recentQA }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    
    supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .gte('window_start', fiveHoursAgo)
      .single(),

    supabase
      .from('rooms')
      .select(`
        id, name, subject, description, member_count, created_at,
        creator:profiles(display_name)
      `)
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(4),

    supabase
      .from('qa_posts')
      .select(`
        id, title, subject, upvotes, answer_count, is_solved, created_at,
        author:profiles(id, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hey {profile?.display_name?.split(' ')[0]}! <span className="animate-pulse inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Ready to crush your goals today?</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-500/20">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          {recentRooms?.length || 0} Rooms Live Now
        </div>
      </div>

      {/* Hero AI Search Section - Glassmorphism */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-8 md:p-12 shadow-2xl text-white overflow-hidden border border-white/10">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Sparkles className="w-64 h-64 text-indigo-100 rotate-12" />
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-bold uppercase tracking-widest">AI Study Buddy v2.0</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Solve any concept <br />in seconds.
            </h2>
            <form action="/ai-buddy" className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input 
                  name="q"
                  type="text" 
                  placeholder="Explain quantum entanglement..." 
                  className="w-full pl-5 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-xl transition-all"
                />
              </div>
              <Button type="submit" variant="secondary" className="px-8 h-auto py-4 rounded-2xl font-bold bg-white text-indigo-900 hover:bg-indigo-50 shadow-xl transition-transform active:scale-95">
                Ask AI <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
            <div className="mt-6 flex items-center gap-4 text-[13px] font-medium text-indigo-200/80">
              {profile?.is_premium ? (
                <span className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/10">⭐ Premium: Unlimited Access</span>
              ) : (
                <span className="flex items-center gap-1.5 py-1 px-3 bg-white/5 rounded-full border border-white/10">
                  {aiUsage?.count || 0}/5 free AI questions used
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Points', value: profile?.points || 0, icon: Trophy, color: 'amber' },
          { label: 'QA Answers', value: 0, icon: MessagesSquare, color: 'blue' },
          { label: 'Rooms Joined', value: 0, icon: Users, color: 'emerald' },
          { label: 'AI Inquiries', value: aiUsage?.count || 0, icon: Sparkles, color: 'indigo' },
        ].map((stat, i) => {
          const Icon = stat.icon
          const colors: any = {
            amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
          }
          return (
            <Card key={i} className="glass-card hover:border-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-10 transition-opacity bg-${stat.color}-500`} />
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className={`w-12 h-12 ${colors[stat.color]} border rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-foreground tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Rooms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Study Rooms
            </h2>
            <Link href="/rooms" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              View all rooms <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {recentRooms && recentRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(recentRooms as any[]).map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 border-2 border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-foreground">No active rooms</p>
              <p className="text-sm mb-6">Be the leader and start your own study session.</p>
              <Link href="/rooms">
                <Button variant="outline" className="rounded-xl border-2 font-bold px-6">Create the first one</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent QA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Latest Q&A
            </h2>
            <Link href="/qa" className="text-sm font-bold text-muted-foreground hover:text-indigo-600">
              Board
            </Link>
          </div>

          <Card className="glass-card rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {recentQA && recentQA.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentQA.map((post) => (
                    <Link href={`/qa/${post.id}`} key={post.id} className="block hover:bg-indigo-500/5 p-5 transition-colors group">
                      <div className="flex gap-4">
                        <div className="shrink-0 pt-1">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${post.is_solved ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-[15px] line-clamp-2 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                              {post.subject}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60 font-medium">by {(post as any).author?.display_name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <MessagesSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm font-bold">No questions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

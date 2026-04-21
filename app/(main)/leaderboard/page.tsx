'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Crown, Trophy, Sparkles, Loader2 } from 'lucide-react'
import { getInitials, formatPoints } from '@/lib/utils'

type Period = 'week' | 'month' | 'all'

const TABS: { label: string; value: Period }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
]

export default function LeaderboardPage() {
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('all')
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_color, points, is_premium')
      .order('points', { ascending: false })
      .limit(50)

    setTopUsers(data || [])
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50 dark:ring-amber-950/20">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Global Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The most helpful students on PupilNetwork. Climb the ranks by answering questions and helping peers.
        </p>
      </div>

      {/* Top 3 Podium */}
      {!loading && topUsers.length >= 3 && (
        <div className="hidden md:flex justify-center items-end gap-6 mb-12 mt-8 px-4">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-20 h-20 border-4 border-muted shadow-md">
                <AvatarFallback style={{ backgroundColor: topUsers[1].avatar_color || '#cbd5e1', color: 'white', fontSize: '24px' }}>
                  {getInitials(topUsers[1].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold shadow-sm border-2 border-background">2</div>
            </div>
            <Link href={`/profile/${topUsers[1].username}`} className="font-bold text-foreground hover:text-indigo-600 truncate max-w-[120px] text-center">
              {topUsers[1].display_name}
              {topUsers[1].is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500 inline ml-1" />}
            </Link>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">{formatPoints(topUsers[1].points)} pts</span>
            <div className="w-24 h-24 bg-gradient-to-t from-muted to-muted/20 mt-4 rounded-t-xl border border-b-0 border-border" />
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center z-10">
            <div className="relative mb-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 pb-1">
                <Crown className="w-8 h-8 text-yellow-400 drop-shadow-md" />
              </div>
              <Avatar className="w-28 h-28 border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-400/20">
                <AvatarFallback style={{ backgroundColor: topUsers[0].avatar_color || '#cbd5e1', color: 'white', fontSize: '32px' }}>
                  {getInitials(topUsers[0].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black shadow-md border-2 border-background text-lg">1</div>
            </div>
            <Link href={`/profile/${topUsers[0].username}`} className="font-bold text-foreground text-lg hover:text-indigo-600 truncate max-w-[150px] text-center">
              {topUsers[0].display_name}
              {topUsers[0].is_premium && <Crown className="w-4 h-4 text-yellow-500 inline ml-1.5" />}
            </Link>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-lg">{formatPoints(topUsers[0].points)} pts</span>
            <div className="w-32 h-32 bg-gradient-to-t from-amber-100/30 to-yellow-500/10 mt-4 rounded-t-2xl border border-b-0 border-yellow-200/50 shadow-[0_-10px_20px_-10px_rgba(251,191,36,0.3)]" />
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-20 h-20 border-4 border-amber-700/40 shadow-md">
                <AvatarFallback style={{ backgroundColor: topUsers[2].avatar_color || '#cbd5e1', color: 'white', fontSize: '24px' }}>
                  {getInitials(topUsers[2].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-700/40 rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">3</div>
            </div>
            <Link href={`/profile/${topUsers[2].username}`} className="font-bold text-slate-800 hover:text-indigo-600 truncate max-w-[120px] text-center">
              {topUsers[2].display_name}
              {topUsers[2].is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500 inline ml-1" />}
            </Link>
            <span className="text-indigo-600 font-bold mt-1">{formatPoints(topUsers[2].points)} pts</span>
            <div className="w-24 h-16 bg-gradient-to-t from-amber-50 to-orange-50 mt-4 rounded-t-xl border border-b-0 border-amber-100" />
          </div>
        </div>
      )}

      {/* List with Period Tabs */}
      <Card className="bg-card border-border shadow-sm overflow-hidden mb-12">
        <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-foreground">Top 50 Students</h2>

          {/* Period Switcher */}
          <div className="flex items-center bg-muted/50 border border-border rounded-xl p-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {period === 'all' ? 'No students on the leaderboard yet.' : `No activity this ${period === 'week' ? 'week' : 'month'} yet.`}
            </p>
            <p className="text-sm mt-1">Answer questions to earn points and appear here!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topUsers.map((profile, i) => {
              const isMe = currentUserId === profile.id
              const rank = i + 1
              return (
                <div
                  key={profile.id}
                  className={`flex items-center gap-4 px-4 sm:px-6 py-4 transition-colors ${
                    isMe ? 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-8 text-center font-bold ${
                    rank === 1 ? 'text-yellow-500 text-lg' :
                    rank === 2 ? 'text-muted-foreground text-lg' :
                    rank === 3 ? 'text-amber-700 dark:text-amber-500 text-lg' : 'text-muted-foreground/50'
                  }`}>
                    #{rank}
                  </div>

                  <Link href={`/profile/${profile.username}`} className="flex-1 flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 shrink-0 border border-background shadow-sm ring-1 ring-border">
                      <AvatarFallback style={{ backgroundColor: profile.avatar_color || '#cbd5e1', color: 'white', fontSize: '14px' }}>
                        {getInitials(profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                        {profile.display_name}
                        {profile.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        {isMe && <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full font-bold text-sm border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    {profile.points ?? 0} pts
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

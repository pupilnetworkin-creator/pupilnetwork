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
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-amber-100 dark:border-amber-500/20 mb-2">
          <Trophy className="w-3.5 h-3.5" /> Hall of Fame
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Leaderboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          The most helpful students on PupilNetwork. Climb the ranks by answering questions and helping peers.
        </p>
      </div>

      {/* Top 3 Podium - Redesigned */}
      {!loading && topUsers.length >= 3 && (
        <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-10 mb-16 mt-8 px-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center order-2 md:order-1">
            <div className="relative mb-6">
              <div className="absolute -inset-2 bg-slate-200 dark:bg-slate-700 rounded-full blur opacity-50"></div>
              <Avatar className="w-24 h-24 border-4 border-slate-200 dark:border-slate-700 shadow-xl relative z-10">
                <AvatarFallback className="font-black text-2xl" style={{ backgroundColor: topUsers[1].avatar_color || '#cbd5e1', color: 'white' }}>
                  {getInitials(topUsers[1].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-black shadow-lg border-4 border-background z-20">2</div>
            </div>
            <Link href={`/profile/${topUsers[1].username}`} className="font-black text-foreground hover:text-indigo-600 transition-colors text-lg text-center flex items-center gap-1">
              {topUsers[1].display_name}
              {topUsers[1].is_premium && <Crown className="w-4 h-4 text-amber-500" />}
            </Link>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full font-black text-sm border border-indigo-100 dark:border-indigo-500/20 mt-2">
              {formatPoints(topUsers[1].points)} PTS
            </div>
            <div className="w-32 h-20 bg-gradient-to-t from-slate-100 dark:from-slate-800/50 to-transparent mt-6 rounded-t-3xl border-x border-t border-border/50" />
          </div>

          {/* 1st Place - The King */}
          <div className="flex flex-col items-center z-20 order-1 md:order-2">
            <div className="relative mb-8">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full blur opacity-30 animate-pulse"></div>
              <Avatar className="w-32 h-32 border-4 border-yellow-400 shadow-[0_0_50px_-12px_rgba(250,204,21,0.5)] ring-4 ring-yellow-400/20 relative z-10">
                <AvatarFallback className="font-black text-4xl" style={{ backgroundColor: topUsers[0].avatar_color || '#cbd5e1', color: 'white' }}>
                  {getInitials(topUsers[0].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-white font-black shadow-2xl border-4 border-background text-2xl z-20">1</div>
            </div>
            <Link href={`/profile/${topUsers[0].username}`} className="font-black text-foreground text-2xl hover:text-indigo-600 transition-colors text-center flex items-center gap-2">
              {topUsers[0].display_name}
              {topUsers[0].is_premium && <Crown className="w-5 h-5 text-amber-500" />}
            </Link>
            <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-6 py-2 rounded-full font-black text-lg border border-amber-200 dark:border-amber-500/30 mt-3 shadow-lg shadow-amber-500/10">
              {formatPoints(topUsers[0].points)} PTS
            </div>
            <div className="w-40 h-32 bg-gradient-to-t from-amber-500/10 dark:from-amber-500/5 to-transparent mt-8 rounded-t-[3rem] border-x border-t border-amber-500/20" />
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center order-3">
            <div className="relative mb-6">
              <div className="absolute -inset-2 bg-amber-700 dark:bg-amber-900 rounded-full blur opacity-30"></div>
              <Avatar className="w-24 h-24 border-4 border-amber-700/40 shadow-xl relative z-10">
                <AvatarFallback className="font-black text-2xl" style={{ backgroundColor: topUsers[2].avatar_color || '#cbd5e1', color: 'white' }}>
                  {getInitials(topUsers[2].display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-700/60 rounded-full flex items-center justify-center text-white font-black shadow-lg border-4 border-background z-20">3</div>
            </div>
            <Link href={`/profile/${topUsers[2].username}`} className="font-black text-foreground hover:text-indigo-600 transition-colors text-lg text-center flex items-center gap-1">
              {topUsers[2].display_name}
              {topUsers[2].is_premium && <Crown className="w-4 h-4 text-amber-500" />}
            </Link>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full font-black text-sm border border-indigo-100 dark:border-indigo-500/20 mt-2">
              {formatPoints(topUsers[2].points)} PTS
            </div>
            <div className="w-32 h-14 bg-gradient-to-t from-amber-700/10 to-transparent mt-6 rounded-t-3xl border-x border-t border-border/50" />
          </div>
        </div>
      )}

      {/* Main Ranking List - Modern & Glassy */}
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl shadow-slate-200/10 dark:shadow-none overflow-hidden">
        <div className="bg-muted/30 border-b border-border/50 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Elite Top 50</h2>
          </div>

          {/* Period Switcher - Glass Style */}
          <div className="flex items-center bg-background/50 border border-border/50 rounded-2xl p-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === tab.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-300 mb-4" />
            <p className="text-muted-foreground font-black animate-pulse">Calculating rankings...</p>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-20 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-muted-foreground/20" />
            <h3 className="text-2xl font-black text-foreground mb-2">The board is clear</h3>
            <p className="text-muted-foreground font-medium">Answer questions to earn points and claim your spot!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {topUsers.map((profile, i) => {
              const isMe = currentUserId === profile.id
              const rank = i + 1
              return (
                <div
                  key={profile.id}
                  className={`flex items-center gap-4 px-6 sm:px-10 py-5 transition-all group ${
                    isMe ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-12 text-center font-black text-xl tracking-tighter ${
                    rank === 1 ? 'text-yellow-500' :
                    rank === 2 ? 'text-slate-400' :
                    rank === 3 ? 'text-amber-700' : 'text-muted-foreground/30'
                  }`}>
                    {rank < 10 ? `0${rank}` : rank}
                  </div>

                  <Link href={`/profile/${profile.username}`} className="flex-1 flex items-center gap-4 min-w-0 group/profile">
                    <div className="relative">
                      <Avatar className="w-12 h-12 shrink-0 border-2 border-background shadow-md group-hover/profile:scale-110 transition-transform duration-300">
                        <AvatarFallback className="font-black text-sm" style={{ backgroundColor: profile.avatar_color || '#cbd5e1', color: 'white' }}>
                          {getInitials(profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.is_premium && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-foreground text-lg truncate flex items-center gap-2 group-hover/profile:text-indigo-600 transition-colors">
                        {profile.display_name}
                        {isMe && <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white bg-indigo-600 px-2.5 py-0.5 rounded-full">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-bold tracking-tight">@{profile.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-5 py-2 rounded-2xl font-black text-sm border border-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                    {profile.points ?? 0}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

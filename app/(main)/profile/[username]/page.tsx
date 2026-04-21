import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles, MessageCircle, HelpCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react'
import { getInitials, timeAgo } from '@/lib/utils'
import { EditProfileButton } from '@/components/profile/EditProfileButton'

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params
  const username = params.username
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">User Not Found</h1>
        <p className="text-slate-500">This profile does not exist.</p>
      </div>
    )
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwner = currentUser?.id === profile.id

  const [{ count: questionsCount }, { count: answersCount }, { count: acceptedCount }] = await Promise.all([
    supabase.from('qa_posts').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
    supabase.from('answers').select('*', { count: 'exact', head: true }).eq('author_id', profile.id),
    supabase.from('answers').select('*', { count: 'exact', head: true }).eq('author_id', profile.id).eq('is_accepted', true),
  ])

  const { data: recentQuestions } = await supabase
    .from('qa_posts')
    .select('id, title, subject, created_at, upvotes, is_solved')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentAnswers } = await supabase
    .from('answers')
    .select('id, content, created_at, upvotes, is_accepted, post:qa_posts(id, title)')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const accentColor = profile.avatar_color || '#6366f1'

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Profile Header Card ── */}
      <Card className="border-none shadow-lg overflow-hidden bg-white">
        {/* Banner */}
        <div
          className="h-32 w-full"
          style={{ background: `linear-gradient(135deg, ${accentColor}44 0%, ${accentColor}aa 100%)` }}
        />

        <CardContent className="px-6 sm:px-10 pb-8 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative group/avatar">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl ring-1 ring-slate-100 shrink-0 overflow-hidden bg-white">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />
                )}
              <AvatarFallback 
                className="font-sans antialiased text-4xl font-bold text-white shadow-inner"
                style={{ backgroundColor: accentColor }}
              >
                {getInitials(profile.display_name)}
              </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {profile.display_name}
                </h1>
                
                <div className="flex items-center gap-2">
                  {profile.is_premium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 border-none shadow-sm font-bold gap-1 py-0.5 px-2.5">
                      <Crown className="w-3 h-3" /> Premium
                    </Badge>
                  )}
                  
                  {/* Integrated Points Pill */}
                  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs shadow-sm">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    {profile.points ?? 0} pts
                  </div>
                </div>

                {isOwner && (
                  <EditProfileButton profile={profile} />
                )}
              </div>
              
              <p className="text-slate-400 font-medium mb-3">@{profile.username}</p>
              
              {profile.bio ? (
                <p className="text-slate-600 text-[15px] leading-relaxed max-w-2xl mb-4 font-medium">{profile.bio}</p>
              ) : (
                <p className="text-slate-400 italic text-sm mb-4">No bio provided yet.</p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm" title="GitHub">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  </a>
                )}
                {profile.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all shadow-sm" title="Instagram">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm" title="LinkedIn">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Sparkles, label: 'Total Points', value: profile.points ?? 0, color: 'indigo' },
          { icon: HelpCircle, label: 'Questions', value: questionsCount ?? 0, color: 'blue' },
          { icon: MessageCircle, label: 'Answers', value: answersCount ?? 0, color: 'emerald' },
          { icon: CheckCircle2, label: 'Accepted', value: acceptedCount ?? 0, color: 'green' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Activity Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Questions */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 px-1">
            <HelpCircle className="w-4 h-4 text-blue-500" /> Questions Asked
          </h2>
          <Card className="border-slate-100 shadow-sm overflow-hidden min-h-[100px]">
            {recentQuestions && recentQuestions.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentQuestions.map(post => (
                  <Link key={post.id} href={`/qa/${post.id}`} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{post.subject}</span>
                        <span className="text-[11px] text-slate-400">{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0 pt-0.5">
                      <ArrowUpCircle className="w-3.5 h-3.5" />{post.upvotes}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic">No questions asked yet.</div>
            )}
          </Card>
        </div>

        {/* Recent Answers */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 px-1">
            <MessageCircle className="w-4 h-4 text-emerald-500" /> Recent Answers
          </h2>
          <Card className="border-slate-100 shadow-sm overflow-hidden min-h-[100px]">
            {recentAnswers && recentAnswers.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentAnswers.map((ans: any) => (
                  <Link key={ans.id} href={`/qa/${ans.post?.id}`} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {ans.post?.title || 'Question'}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{ans.content?.slice(0, 60)}…</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ans.is_accepted && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{timeAgo(ans.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic">No answers given yet.</div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}

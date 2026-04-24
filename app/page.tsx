import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, MessageSquare, MonitorPlay, Sparkles,
  Trophy, Users, CheckCircle2, BookOpen, Brain,
  Video, Star, Shield, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'

export const revalidate = 300 // Cache for 5 minutes

export const metadata = {
  title: 'PupilNetwork — Study Smarter, Together',
  description: 'The student collaboration platform. Live study rooms, peer Q&A, AI tutoring, and gamified learning — all in one place. Built for students in India.',
}

export default async function LandingPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const [
    { data: topUsers },
    { count: studentCount },
    { count: roomCount },
    { count: qaCount }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, points')
      .order('points', { ascending: false })
      .limit(3),
    
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString()),

    supabase
      .from('qa_posts')
      .select('*', { count: 'exact', head: true })
  ])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />

      <main>

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-white">
          {/* Advanced Background effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[100px]" />
            <div className="absolute top-[20%] left-[10%] w-px h-[40%] bg-gradient-to-b from-transparent via-indigo-200/50 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-5xl mx-auto">

              <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full mb-10 shadow-2xl shadow-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Empowering Indian Students
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                The future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient">
                  collaborative study
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-500 mb-12 leading-relaxed max-w-3xl mx-auto font-medium tracking-tight">
                Live study rooms, peer Q&amp;A, and AI tutoring. Built for students who want to <span className="text-slate-900 font-bold underline decoration-indigo-500/30 decoration-4 underline-offset-4">master concepts</span> faster, together.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 text-lg font-black transition-all hover:scale-105 active:scale-95 group">
                    Start Learning Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 rounded-2xl border-2 border-slate-200 text-slate-700 text-lg font-black hover:bg-slate-50 transition-all">
                    Explore Features
                  </Button>
                </Link>
              </div>

              {/* Live stats - Premium Strip */}
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 p-6 rounded-[2rem] max-w-3xl mx-auto shadow-sm">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{studentCount || '1.2k'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students</span>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{roomCount || '45'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Rooms</span>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900">{qaCount || '890'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solved Q&A</span>
                </div>
              </div>
            </div>

            {/* Product Showcase */}
            <div className="mt-20 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[3rem] blur-3xl opacity-10 animate-pulse" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(79,70,229,0.2)] border border-slate-200 ring-1 ring-slate-900/5 aspect-video bg-slate-100 group">
                <Image
                  src="/product_mockup.png"
                  alt="PupilNetwork Dashboard Mockup"
                  fill
                  priority
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-3">
                  <div className="bg-white/90 backdrop-blur-md p-1 pr-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Status</p>
                      <p className="text-sm font-black text-slate-900 leading-none">Global Server Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF STRIP ──────────────────────────── */}
        <section className="py-10 border-y border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm font-semibold tracking-wide uppercase">
            <span>Powered by</span>
            <span className="text-slate-600">Groq · Llama 3.1</span>
            <span>•</span>
            <span className="text-slate-600">Supabase</span>
            <span>•</span>
            <span className="text-slate-600">Jitsi Meet</span>
            <span>•</span>
            <span className="text-slate-600">Next.js</span>
            <span>•</span>
            <span className="text-slate-600">Resend</span>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────── */}
        <section id="features" className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Platform Features</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Everything in one place
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                No more juggling between WhatsApp groups, YouTube, and Chegg. PupilNetwork has it all.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MonitorPlay className="w-7 h-7 text-indigo-600" />,
                  bg: 'bg-indigo-50',
                  title: 'Live Study Rooms',
                  desc: 'Create or join subject-specific rooms. Chat with classmates in real-time and hop on encrypted video calls instantly.',
                  checks: ['Real-time messaging', 'Subject-specific lobbies', 'Video calls (Premium)'],
                  color: 'text-indigo-600',
                },
                {
                  icon: <MessageSquare className="w-7 h-7 text-purple-600" />,
                  bg: 'bg-purple-50',
                  title: 'Peer Q&A Board',
                  desc: 'Post any academic question, get answers from peers. Vote the best answers. Earn points for every helpful reply.',
                  checks: ['Markdown & code blocks', 'Upvotes & accepted answers', 'Points for every answer'],
                  color: 'text-purple-600',
                },
                {
                  icon: <Brain className="w-7 h-7 text-pink-600" />,
                  bg: 'bg-pink-50',
                  title: 'AI Study Buddy',
                  desc: 'Your personal 24/7 tutor powered by Google Gemini 2.0. Explain concepts, solve problems, and review your notes.',
                  checks: ['Gemini 2.0 powered', 'Understands regional languages', 'Unlimited for Premium users'],
                  color: 'text-pink-600',
                },
              ].map((f) => (
                <div key={f.title} className="group bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {f.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-6 text-[15px]">{f.desc}</p>
                  <ul className="space-y-2.5">
                    {f.checks.map((c) => (
                      <li key={c} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className={`w-4 h-4 ${f.color} shrink-0`} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────── */}
        <section id="how-it-works" className="py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">How It Works</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Up and running in 60 seconds
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[17%] right-[17%] h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 z-0" />
              {[
                { step: '01', icon: <Shield className="w-6 h-6 text-indigo-500" />, title: 'Create your account', desc: 'Sign up with email or Google in under 30 seconds. No credit card. No spam.' },
                { step: '02', icon: <Users className="w-6 h-6 text-purple-500" />, title: 'Join or create a room', desc: 'Browse rooms by subject, join a live session, or create your own for your class.' },
                { step: '03', icon: <Star className="w-6 h-6 text-amber-500" />, title: 'Study, help & earn', desc: 'Answer questions, earn points, and climb the leaderboard. The more you help, the higher you rank.' },
              ].map((item) => (
                <div key={item.step} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center mb-6">
                    <span className="text-3xl font-black text-slate-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.step}</span>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{item.title}</h3>
                  <p className="text-slate-500 text-[15px] max-w-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD PREVIEW ─────────────────────────── */}
        <section className="py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left copy */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-4">Gamified Learning</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Help others.<br />Climb the ranks.
                </h2>
                <p className="text-slate-500 text-lg mb-8 max-w-md">
                  Every question you answer earns you points. Compete with students across India and show up at the top of the global leaderboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/leaderboard">
                    <Button variant="outline" className="border-2 border-slate-200 font-semibold h-12 px-6 hover:border-indigo-300 hover:text-indigo-700">
                      <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
                    </Button>
                  </Link>
                  <Link href="/qa">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 px-6">
                      Answer Questions <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: live leaderboard card */}
              <div className="flex-1 w-full max-w-sm mx-auto">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 shadow-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-bold">Global Leaderboard</span>
                    </div>
                    <span className="text-xs text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">Live</span>
                  </div>
                  <div className="space-y-3">
                    {topUsers && topUsers.length > 0 ? (
                      topUsers.map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-xl w-8 text-center">{medals[i]}</span>
                            <div className="w-9 h-9 rounded-full bg-indigo-500/40 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-indigo-400/20">
                              {getInitials(user.display_name)}
                            </div>
                            <span className="text-white font-semibold text-sm">{user.display_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm">
                            <Zap className="w-3.5 h-3.5" />{user.points} pts
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-indigo-300">
                        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-white mb-1">Be the first!</p>
                        <p className="text-xs">Answer a question and claim #1 on the board.</p>
                      </div>
                    )}
                  </div>
                  <Link href="/leaderboard" className="block text-center text-indigo-300 text-xs font-semibold mt-4 hover:text-white transition-colors">
                    See full leaderboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────── */}
        <section id="pricing" className="py-28 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Student-friendly pricing
              </h2>
              <p className="text-lg text-slate-500">
                Core features are free, forever. Upgrade for the full experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-1">Basic</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black text-slate-900">₹0</span>
                  <span className="text-slate-400 font-medium ml-1">/ forever</span>
                </div>
                <p className="text-slate-500 text-sm mb-8">Everything you need to get started.</p>
                <ul className="space-y-4 mb-10">
                  {[
                    'Join up to 3 study rooms per day',
                    'Full Q&A board access',
                    '5 AI questions per hour',
                    'Leaderboard & points',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-slate-700 text-[15px]">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-slate-400 text-[15px]">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" /> Video calls
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-2">Start Free</Button>
                </Link>
              </div>

              {/* Premium */}
              <div className="relative bg-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-200 overflow-hidden">
                <div className="absolute top-0 right-0 bg-white/10 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl tracking-widest">
                  MOST POPULAR
                </div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mb-10 pointer-events-none" />
                <h3 className="text-lg font-bold text-indigo-200 uppercase tracking-wider mb-1">Premium ⭐</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black text-white">₹99</span>
                  <span className="text-indigo-200 font-medium ml-1">/ month</span>
                </div>
                <p className="text-indigo-200 text-sm mb-8">Unlock everything. No auto-renewal.</p>
                <ul className="space-y-4 mb-10">
                  {[
                    { text: 'Unlimited study rooms', highlight: false },
                    { text: 'Unlimited AI Study Buddy', highlight: false },
                    { text: 'Full Video Call access', highlight: true },
                    { text: 'Priority leaderboard badge', highlight: false },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-[15px]">
                      <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />
                      <span className={f.highlight ? 'text-white font-bold' : 'text-indigo-100'}>{f.text}</span>
                      {f.highlight && <Badge className="bg-white/20 text-white text-[10px] border-none px-2 py-0.5 font-bold ml-auto">HOT</Badge>}
                    </li>
                  ))}
                </ul>
                <Link href="/premium">
                  <Button className="w-full h-12 text-base font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg">
                    Get Premium <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-center text-indigo-300 text-xs mt-4">Pay via UPI · Instant activation</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────── */}
        <section className="py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl px-8 py-16 shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16 pointer-events-none" />
              <div className="relative">
                <p className="text-indigo-200 font-bold text-sm uppercase tracking-widest mb-4">Join Now</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Ready to study smarter?
                </h2>
                <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
                  Join {studentCount && studentCount > 0 ? `${studentCount}+ student${studentCount !== 1 ? 's' : ''}` : 'students'} already using PupilNetwork to collaborate, learn, and grow.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="h-14 px-10 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-base rounded-xl shadow-lg">
                      Create Free Account <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/rooms">
                    <Button size="lg" variant="outline" className="h-14 px-10 bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold text-base rounded-xl">
                      Browse Study Rooms
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <SEOContent />
    </div>
  )
}

function SEOContent() {
  return (
    <section className="sr-only">
      <h2>About PupilNetwork Study Platform</h2>
      <p>
        PupilNetwork is the ultimate student collaboration platform designed specifically for the Indian academic landscape. 
        Our platform bridges the gap between traditional learning and modern digital tools by offering a centralized hub for all study needs.
      </p>
      <h3>Comprehensive Study Tools</h3>
      <ul>
        <li>
          <strong>Live Study Rooms:</strong> Engaging virtual environments where students can collaborate in real-time, share resources, and participate in peer-led study sessions.
        </li>
        <li>
          <strong>Academic Q&A Board:</strong> A community-driven forum where you can post doubts, get answers from top-performing peers, and earn points for your contributions.
        </li>
        <li>
          <strong>AI-Powered Tutoring:</strong> Leverage the power of Google Gemini 2.0 to get instant explanations, step-by-step solutions, and personalized study assistance 24/7.
        </li>
        <li>
          <strong>Gamified Success:</strong> Stay motivated with our global leaderboard. Earn badges, points, and prestige as you help others succeed in their academic journey.
        </li>
      </ul>
      <h3>Why Students in India Love PupilNetwork</h3>
      <p>
        Unlike fragmented tools like WhatsApp or expensive alternatives like Chegg, PupilNetwork provides a focused, ad-free environment. 
        Whether you're preparing for JEE, medical exams, or college finals, our platform offers the support and community you need to excel. 
        Join thousands of students who are already studying smarter, together.
      </p>
    </section>
  )
}

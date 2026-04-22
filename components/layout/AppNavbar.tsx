'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Sparkles,
  Trophy,
  User,
  LogOut,
  Menu,
  Bell,
  Crown,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const appLinks = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/rooms',       label: 'Rooms',       icon: Users },
  { href: '/friends',     label: 'Friends',     icon: UserPlus },
  { href: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
  { href: '/messages',    label: 'Messages',    icon: MessageSquare },
  { href: '/qa',          label: 'Q&A',         icon: GraduationCap },
  { href: '/ai-buddy',    label: 'AI Buddy',     icon: Sparkles },
]

export default function AppNavbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; username: string; avatar_color: string; is_premium: boolean } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('profiles')
          .select('display_name, username, avatar_color, is_premium')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 py-3">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground hidden lg:block tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PupilNetwork
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/50">
            {appLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'bg-background text-indigo-600 shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-muted-foreground/50'}`} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Theme + Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            {profile?.is_premium && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                <Crown className="w-3 h-3" /> Premium
              </div>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-2xl pl-1 pr-1 py-1 hover:bg-muted transition-colors outline-none cursor-pointer border border-transparent hover:border-border/50">
                  <Avatar className="w-9 h-9 border-2 border-background shadow-md shrink-0">
                    <AvatarFallback
                      className="font-sans antialiased text-xs font-black text-white shadow-inner"
                      style={{ backgroundColor: profile?.avatar_color || '#6366f1' }}
                    >
                      {getInitials(profile?.display_name || profile?.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start pr-2">
                    <span className="text-xs font-black text-foreground leading-none">
                      {profile?.display_name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">My Account</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-border/50 backdrop-blur-xl">
                  <div className="px-3 py-3 mb-1 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-black text-foreground truncate">{profile?.display_name}</p>
                    <p className="text-[11px] text-muted-foreground font-bold truncate">@{profile?.username}</p>
                  </div>
                  <div className="space-y-1 mt-1">
                    <DropdownMenuItem onClick={() => router.push(`/profile/${profile?.username}`)} className="gap-3 cursor-pointer py-2.5 rounded-xl font-bold text-sm">
                      <User className="w-4 h-4 text-slate-400" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/premium')} className="gap-3 cursor-pointer py-2.5 rounded-xl font-bold text-sm">
                      <Crown className="w-4 h-4 text-amber-500" /> Premium Benefits
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50 mx-1" />
                    <DropdownMenuItem onClick={handleLogout} className="gap-3 text-red-500 cursor-pointer py-2.5 rounded-xl font-bold text-sm hover:!bg-red-50 dark:hover:!bg-red-500/10 focus:!text-red-600 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden p-2.5 bg-muted rounded-2xl border border-border/50 hover:bg-muted/80 transition-colors">
                <Menu className="w-5 h-5 text-foreground" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r border-border/50 shadow-2xl">
                <div className="flex flex-col h-full bg-background">
                  {/* Mobile header */}
                  <div className="flex items-center gap-3 px-6 py-8 border-b border-border/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-black text-foreground text-xl tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PupilNetwork</span>
                  </div>

                  {/* Mobile nav links */}
                  <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">Main Menu</p>
                    {appLinks.map((link) => {
                      const Icon = link.icon
                      const active = isActive(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold transition-all duration-200 ${
                            active
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-muted-foreground/50'}`} />
                          {link.label}
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile footer */}
                  <div className="mt-auto border-t border-border/50 p-6 space-y-4 bg-muted/20">
                    {profile?.is_premium && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl w-full justify-center">
                        <Crown className="w-4 h-4" /> Premium Member
                      </div>
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout() }}
                      className="flex items-center justify-center gap-3 text-red-500 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 py-3.5 rounded-2xl w-full text-sm font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

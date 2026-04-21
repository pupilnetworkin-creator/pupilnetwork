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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-indigo-100 dark:shadow-none">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground hidden lg:block tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PupilNetwork
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {appLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                      : 'text-muted-foreground hover:bg-muted dark:hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 translate-y-[0.5px] ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground/60'}`} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Theme + Avatar */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {profile?.is_premium && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                <Crown className="w-3 h-3" /> Premium
              </div>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors outline-none cursor-pointer">
                  <Avatar className="w-8 h-8 border-2 border-background shadow-sm shrink-0">
                    <AvatarFallback
                      className="font-sans antialiased text-[11px] font-bold text-white shadow-inner"
                      style={{ backgroundColor: profile?.avatar_color || '#6366f1' }}
                    >
                      {getInitials(profile?.display_name || user.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold text-foreground hidden sm:block font-sans tracking-tight leading-none translate-y-[0.5px]">
                    {profile?.display_name?.split(' ')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push(`/profile/${profile?.username}`)} className="gap-2 cursor-pointer">
                    <User className="w-4 h-4" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/premium')} className="gap-2 cursor-pointer">
                    <Crown className="w-4 h-4 text-amber-500" /> Premium
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 cursor-pointer focus:text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile header */}
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-foreground text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PupilNetwork</span>
                  </div>

                  {/* Mobile nav links */}
                  <nav className="flex-1 px-3 py-4 space-y-1">
                    {appLinks.map((link) => {
                      const Icon = link.icon
                      const active = isActive(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                            active
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {link.label}
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile footer */}
                  <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                    {profile?.is_premium && (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full w-fit">
                        <Crown className="w-3 h-3" /> Premium Member
                      </div>
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout() }}
                      className="flex items-center gap-2 text-red-600 text-sm font-medium w-full py-2"
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

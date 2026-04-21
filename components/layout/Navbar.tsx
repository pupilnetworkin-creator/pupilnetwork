'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GraduationCap, Menu, LogOut, User, LayoutDashboard, BookOpen } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ display_name: string; username: string; avatar_color: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('display_name, username, avatar_color').eq('id', user.id).single().then(({ data }) => setProfile(data))
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

  const isLandingPage = pathname === '/'

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/#pricing', label: 'Pricing' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLandingPage
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              PupilNetwork
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors outline-none cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        style={{ backgroundColor: profile?.avatar_color || '#6366f1', color: 'white', fontSize: '12px' }}
                      >
                        {getInitials(profile?.display_name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{profile?.display_name?.split(' ')[0]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/profile/${profile?.username}`)} className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/premium')} className="flex items-center gap-2 cursor-pointer">
                    ⭐ Premium
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors">
              <Menu className="w-5 h-5 text-gray-700" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium text-gray-700 hover:text-indigo-600 py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-4 space-y-2">
                  {user ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Button>
                      </Link>
                      <Button variant="ghost" className="w-full justify-start gap-2 text-red-600" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /> Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full">Log in</Button>
                      </Link>
                      <Link href="/signup" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

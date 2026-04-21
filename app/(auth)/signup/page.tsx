'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, GraduationCap, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function checkUsername(username: string) {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    setUsernameChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()
    setUsernameAvailable(!data)
    setUsernameChecking(false)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required'
    if (!formData.username || formData.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    if (usernameAvailable === false) newErrors.username = 'Username is already taken'
    if (!formData.email.includes('@')) newErrors.email = 'Enter a valid email'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          display_name: formData.displayName,
          username: formData.username.toLowerCase(),
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Try logging in.' })
      } else {
        setErrors({ general: error.message })
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // Insert into profiles
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: formData.username.toLowerCase(),
        display_name: formData.displayName,
        avatar_color: '#6366f1',
      })

      // Send welcome email via API route
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome', email: formData.email, name: formData.displayName }),
      }).catch(() => {}) // Non-blocking
    }

    toast.success('Account created! Welcome to PupilNetwork 🎓')
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PupilNetwork
            </span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Join 200+ students already studying together</p>
        </div>

        <Card className="border-0 shadow-xl shadow-indigo-100/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create your account</CardTitle>
            <CardDescription>Free forever. No credit card needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full h-11 gap-3 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
              )}
              Sign up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Rahul Sharma"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className={errors.displayName ? 'border-red-400' : ''}
                />
                {errors.displayName && <p className="text-red-500 text-xs">{errors.displayName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <Input
                    id="username"
                    placeholder="rahul_123"
                    className={`pl-7 pr-8 ${errors.username ? 'border-red-400' : ''}`}
                    value={formData.username}
                    onChange={(e) => {
                      handleChange('username', e.target.value)
                      checkUsername(e.target.value)
                    }}
                  />
                  {usernameChecking && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {!usernameChecking && usernameAvailable === true && formData.username.length >= 3 && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                {!errors.username && usernameAvailable === false && (
                  <p className="text-red-500 text-xs">Username already taken</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'border-red-400' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-red-400' : ''}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>

              <p className="text-center text-xs text-gray-400">
                By signing up you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
              </p>
            </form>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

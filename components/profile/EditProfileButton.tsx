'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pencil, X, Check, Loader2, Camera } from 'lucide-react'

// Brand icons removed from lucide-react — using inline SVGs instead
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#1e293b',
]

interface EditProfileButtonProps {
  profile: {
    id: string
    display_name: string
    bio: string | null
    avatar_color: string
    avatar_url?: string | null
    github_url?: string | null
    instagram_url?: string | null
    linkedin_url?: string | null
  }
}

export function EditProfileButton({ profile }: EditProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarColor, setAvatarColor] = useState(profile.avatar_color)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [github, setGithub] = useState(profile.github_url || '')
  const [instagram, setInstagram] = useState(profile.instagram_url || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url || null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.')
      return
    }

    // Preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl + `?t=${Date.now()}`)
      toast.success('Photo uploaded!')
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message || 'Check Supabase storage is set up.'))
      setPreviewUrl(profile.avatar_url || null)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty.')
      return
    }
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_color: avatarColor,
        avatar_url: avatarUrl || null,
        github_url: github.trim() || null,
        instagram_url: instagram.trim() || null,
        linkedin_url: linkedin.trim() || null,
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Failed to save: ' + error.message)
      setSaving(false)
      return
    }

    toast.success('Profile updated!')
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit Profile
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Edit Profile
          </h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">

          {/* Avatar Section */}
          <div className="flex items-center gap-5">
            {/* Photo preview */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Upload photo"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* Color picker */}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 mb-2">Avatar Color <span className="text-xs text-slate-400">(used as fallback)</span></p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      avatarColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-slate-400 text-right">{bio.length}/200</p>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Social Links</p>

            <div className="flex items-center gap-3">
              <GithubIcon className="w-5 h-5 text-slate-700 shrink-0" />
              <Input
                value={github}
                onChange={e => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <InstagramIcon className="w-5 h-5 text-pink-500 shrink-0" />
              <Input
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <LinkedinIcon className="w-5 h-5 text-blue-600 shrink-0" />
              <Input
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading || !displayName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

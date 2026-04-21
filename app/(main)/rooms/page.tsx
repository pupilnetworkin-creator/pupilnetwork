'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function RoomsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  
  // Create Room State
  const [newRoom, setNewRoom] = useState({ name: '', subject: '', description: '', duration: '60' })
  const [creating, setCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchRooms()
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  async function fetchRooms() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id, name, subject, description, member_count, created_at,
        creator:profiles!rooms_created_by_fkey(id, display_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRooms(data)
    }
    setLoading(false)
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoom.name.trim() || !newRoom.subject.trim()) return

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in to create a room.')
      setCreating(false)
      return
    }

      const expiresAt = new Date(Date.now() + parseInt(newRoom.duration) * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: newRoom.name,
          subject: newRoom.subject.trim(),
          description: newRoom.description,
          created_by: user.id,
          expires_at: expiresAt
        })
        .select()
        .single()

    if (error) {
      toast.error(error.message)
      setCreating(false)
      return
    }

    toast.success('Room created successfully!')
    setCreateOpen(false)
    setNewRoom({ name: '', subject: '', description: '', duration: '60' })
    router.push(`/rooms/${data.id}`)
  }

  const uniqueSubjects = Array.from(new Set(rooms.map(r => r.subject))).sort()

  const filteredRooms = rooms.filter((room) => {
    const matchesFilter = filter === 'All' || room.subject === filter
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Study Rooms
          </h1>
          <p className="text-muted-foreground mt-1">Join a live room to study with classmates.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-4 rounded-md inline-flex items-center shrink-0 font-medium text-sm transition-colors">
            <Plus className="w-4 h-4" /> Create Room
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a Study Room</DialogTitle>
              <DialogDescription>
                Start a new live session. Anyone can join your room.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRoom} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input 
                  id="name" 
                  placeholder="Calculus Midterm Prep..." 
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g. Mathematics, AI, Physics..." 
                  value={newRoom.subject}
                  onChange={(e) => setNewRoom({...newRoom, subject: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  placeholder="What will you be studying?" 
                  rows={2}
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Session Duration
                </Label>
                <Select 
                  value={newRoom.duration} 
                  onValueChange={(val) => setNewRoom({...newRoom, duration: val})}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                    <SelectItem value="120">2 Hours</SelectItem>
                    <SelectItem value="240">4 Hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">The room will automatically close after this time.</p>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 mt-4" disabled={creating || !newRoom.name || !newRoom.subject}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create and Join
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto gap-2 no-scrollbar hide-scrollbar">
          <Button
            variant={filter === 'All' ? 'default' : 'secondary'}
            onClick={() => setFilter('All')}
            className={`rounded-full shrink-0 ${filter === 'All' ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
          >
            All
          </Button>
          {uniqueSubjects.map((subject) => (
             <Button
             key={subject}
             variant={filter === subject ? 'default' : 'secondary'}
             onClick={() => setFilter(subject)}
             className={`rounded-full shrink-0 px-4 ${filter === subject ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
           >
             {subject}
           </Button>
          ))}
        </div>
        
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search rooms..." 
            className="pl-9 bg-muted/50 border-border focus-visible:ring-indigo-500 rounded-xl text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              currentUserId={currentUserId}
              onDeleted={(id) => setRooms(prev => prev.filter(r => r.id !== id))}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
          <p className="text-muted-foreground text-lg mb-4">No rooms found matching your criteria.</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)} className="border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
            Create the first one
          </Button>
        </div>
      )}
    </div>
  )
}

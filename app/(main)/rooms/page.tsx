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
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Live Collaboration
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Study Rooms
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Join a live room to study with classmates in real-time.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 font-bold" />}>
            <Plus className="w-5 h-5" /> Create New Room
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
              <DialogTitle className="text-2xl font-black tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start a Session</DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium">
                Create a live workspace for your subject.
              </DialogDescription>
            </div>
            <form onSubmit={handleCreateRoom} className="p-8 space-y-5 bg-card">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Room Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Calculus Midterm Prep" 
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Subject Category</Label>
                <Input 
                  id="subject" 
                  placeholder="Mathematics, AI, etc." 
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={newRoom.subject}
                  onChange={(e) => setNewRoom({...newRoom, subject: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Session Length
                </Label>
                <Select 
                  value={newRoom.duration} 
                  onValueChange={(val) => setNewRoom({...newRoom, duration: val ?? '60'})}
                >
                  <SelectTrigger id="duration" className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                    <SelectItem value="120">2 Hours</SelectItem>
                    <SelectItem value="240">4 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 mt-4" disabled={creating || !newRoom.name || !newRoom.subject}>
                {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Launch Room
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search - Glassmorphism */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-card/50 backdrop-blur-xl p-3 rounded-[2rem] border border-border/50 shadow-xl shadow-slate-200/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full no-scrollbar hide-scrollbar px-2">
          <Button
            variant="ghost"
            onClick={() => setFilter('All')}
            className={`rounded-2xl shrink-0 h-11 px-6 font-bold transition-all ${
              filter === 'All' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Subjects
          </Button>
          {uniqueSubjects.map((subject) => (
             <Button
             key={subject}
             variant="ghost"
             onClick={() => setFilter(subject)}
             className={`rounded-2xl shrink-0 h-11 px-6 font-bold transition-all ${
               filter === subject 
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                 : 'text-muted-foreground hover:bg-muted'
             }`}
           >
             {subject}
           </Button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-96 shrink-0 px-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by topic or subject..." 
            className="h-12 pl-12 pr-4 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-2xl text-foreground font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-300 mb-4" />
          <p className="text-muted-foreground font-bold animate-pulse">Syncing live rooms...</p>
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
        <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Search className="w-10 h-10 opacity-20" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2">No rooms found</h3>
          <p className="text-muted-foreground font-medium mb-8">Try adjusting your filters or search terms.</p>
          <Button variant="outline" onClick={() => {setFilter('All'); setSearchQuery('')}} className="rounded-2xl border-2 font-bold px-8 h-12">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, MessageSquare, Loader2 } from 'lucide-react'
import { QuestionCard } from '@/components/qa/QuestionCard'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function QABoardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unanswered' | 'Solved'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Post
  const [createOpen, setCreateOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', subject: '', content: '' })
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('qa_posts')
      .select(`
        id, title, subject, upvotes, answer_count, is_solved, created_at, author_id,
        author:profiles!qa_posts_author_id_fkey(display_name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPosts(data)
    }
    setLoading(false)
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.subject.trim()) return

    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('You must be logged in to post.')
      setPosting(false)
      return
    }

    const { data, error } = await supabase
      .from('qa_posts')
      .insert({
        title: newPost.title,
        content: newPost.content,
        subject: newPost.subject.trim(),
        author_id: user.id,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setPosting(false)
      return
    }

    // Award +10 points for asking a question
    try {
      await supabase.rpc('increment_user_points', { user_id: user.id, amount: 10 })
    } catch {
      // non-critical
    }

    toast.success('Question posted successfully! +10 points earned 🎉')
    setCreateOpen(false)
    setNewPost({ title: '', subject: '', content: '' })
    router.push(`/qa/${data.id}`)
  }

  const uniqueSubjects = Array.from(new Set(posts.map(p => p.subject))).sort()

  const filteredPosts = posts.filter(post => {
    const sMatch = subjectFilter === 'All' || post.subject === subjectFilter
    const statMatch = statusFilter === 'All' || 
                      (statusFilter === 'Solved' && post.is_solved) || 
                      (statusFilter === 'Unanswered' && post.answer_count === 0 && !post.is_solved)
    const qMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    return sMatch && statMatch && qMatch
  })

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <MessageSquare className="w-3 h-3" /> Community Knowledge
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Q&A Board
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Stuck on a concept? Ask the community and earn points for helping others.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 font-bold" />}>
            <Plus className="w-5 h-5" /> Ask a Question
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
              <DialogTitle className="text-2xl font-black tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Post a Question</DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium">
                Be clear and concise. Use Markdown for code blocks.
              </DialogDescription>
            </div>
            <form onSubmit={handleCreatePost} className="p-8 space-y-5 bg-card">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Question Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g. How do I calculate the limit of sin(x)/x...?" 
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Subject</Label>
                <Input 
                  id="subject"
                  placeholder="e.g. Mathematics, AI, Physics..." 
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium"
                  value={newPost.subject}
                  onChange={(e) => setNewPost({...newPost, subject: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Details (Markdown Supported)</Label>
                <Textarea 
                  id="content"
                  placeholder="Provide context, what you've tried so far, and any code samples." 
                  className="min-h-[150px] rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium p-4"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 mt-4" disabled={posting || !newPost.title || !newPost.content || !newPost.subject}>
                {posting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Post to Board
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters - Glassmorphism */}
      <div className="glass-card p-4 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar hide-scrollbar px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mr-2 shrink-0">Subject:</span>
            {['All', ...uniqueSubjects].map((sub) => (
              <Button
                key={sub}
                variant="ghost"
                onClick={() => setSubjectFilter(sub)}
                className={`rounded-xl shrink-0 h-9 px-4 text-xs font-black transition-all ${
                  subjectFilter === sub 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {sub}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-80 shrink-0 px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions..." 
              className="h-11 pl-12 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-2xl text-foreground font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border/50 pt-4 px-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mr-2">Status:</span>
          {['All', 'Unanswered', 'Solved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                statusFilter === status 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-300 mb-4" />
            <p className="text-muted-foreground font-black animate-pulse">Syncing discussions...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <QuestionCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))
        ) : (
          <div className="text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground font-medium mb-8">Try clearing your filters or asking a new question.</p>
            <Button variant="outline" onClick={() => {setSubjectFilter('All'); setStatusFilter('All'); setSearchQuery('')}} className="rounded-2xl border-2 font-bold px-8 h-12">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

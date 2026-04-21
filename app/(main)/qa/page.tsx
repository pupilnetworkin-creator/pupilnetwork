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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Q&A Board
          </h1>
          <p className="text-muted-foreground mt-1">Stuck? Ask a question. Know the answer? Earn points!</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 shrink-0" />}>
            <Plus className="w-4 h-4" /> Post Question
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post a Question</DialogTitle>
              <DialogDescription>
                Ask clearly. You can use Markdown for code blocks and formatting.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  placeholder="e.g. How do I calculate the limit of sin(x)/x as x approaches 0?" 
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  placeholder="e.g. Mathematics, AI, Physics..." 
                  value={newPost.subject}
                  onChange={(e) => setNewPost({...newPost, subject: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Details (Markdown supported)</Label>
                <Textarea 
                  placeholder="Provide context, what you've tried so far, and any code." 
                  rows={6}
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 h-10 mt-4" disabled={posting || !newPost.title || !newPost.content || !newPost.subject}>
                {posting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Post Question
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-sm font-medium text-muted-foreground mr-2 shrink-0">Subject:</span>
            {['All', ...uniqueSubjects].map((sub) => (
              <Button
                key={sub}
                variant={subjectFilter === sub ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSubjectFilter(sub)}
                className={`rounded-full shrink-0 h-8 px-3 text-xs ${subjectFilter === sub ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-muted text-muted-foreground'}`}
              >
                {sub}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions..." 
              className="pl-9 h-9 text-sm bg-muted/50 border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="text-sm font-medium text-muted-foreground mr-2">Status:</span>
          {['All', 'Unanswered', 'Solved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`text-sm px-3 py-1 rounded-md transition-colors ${
                statusFilter === status 
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-medium' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
          <div className="text-center py-24 bg-card rounded-2xl border border-border border-dashed">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No questions found.</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Be the first to ask in this category!</p>
          </div>
        )}
      </div>
    </div>
  )
}

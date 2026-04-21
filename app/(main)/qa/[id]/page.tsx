'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { AnswerCard } from '@/components/qa/AnswerCard'
import { ArrowUp, ChevronLeft, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import { SUBJECT_COLORS, getInitials, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { User } from '@supabase/supabase-js'

export default function QuestionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Post states
  const [upvotes, setUpvotes] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  
  // Answer writing state
  const [newAnswer, setNewAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch post
      const { data: postData } = await supabase
        .from('qa_posts')
        .select(`
          *,
          author:profiles!qa_posts_author_id_fkey(display_name, avatar_color)
        `)
        .eq('id', id)
        .single()

      if (postData) {
        setPost(postData)
        setUpvotes(postData.upvotes)
      }

      // Fetch answers
      const { data: answersData } = await supabase
        .from('answers')
        .select(`
          *,
          author:profiles!answers_author_id_fkey(display_name, avatar_color)
        `)
        .eq('post_id', id)
        .order('is_accepted', { ascending: false }) // Accepted first
        .order('upvotes', { ascending: false })

      if (answersData) setAnswers(answersData)
      setLoading(false)
    }

    loadData()
  }, [id, supabase])

  async function handleQuestionUpvote() {
    if (!user) {
      toast.error('You must log in to upvote.')
      return
    }
    if (hasUpvoted || upvoting || user.id === post.author_id) return

    setUpvoting(true)
    const newUpvotes = upvotes + 1
    setUpvotes(newUpvotes)
    setHasUpvoted(true)

    try {
      await supabase.rpc('increment_post_upvotes', { post_id: post.id })
    } catch {
      await supabase.from('qa_posts').update({ upvotes: newUpvotes }).eq('id', post.id)
    }

    if (post.author_id) {
      try { await supabase.rpc('increment_user_points', { user_id: post.author_id, amount: 1 }) } catch {}
    }

    setUpvoting(false)
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!newAnswer.trim() || submitting || !user) return

    setSubmitting(true)
    const { data, error } = await supabase
      .from('answers')
      .insert({
        post_id: post.id,
        author_id: user.id,
        content: newAnswer,
      })
      .select(`
        *,
        author:profiles!answers_author_id_fkey(display_name, avatar_color)
      `)
      .single()

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    // Update answer count on post
    try {
      await supabase.rpc('increment_answer_count', { post_id: post.id })
    } catch {
      await supabase.from('qa_posts').update({ answer_count: post.answer_count + 1 }).eq('id', post.id)
    }

    // Award +2 points for posting an answer
    try {
      await supabase.rpc('increment_user_points', { user_id: user.id, amount: 2 })
    } catch {
      // non-critical, ignore
    }

    toast.success('Answer posted! +2 points earned 🎉')
    setAnswers(prev => [...prev, data])
    setNewAnswer('')
    setSubmitting(false)
  }

  async function handleAcceptAnswer(answerId: string) {
    if (!user || user.id !== post.author_id) return
    
    // Optimistic UI
    setPost({ ...post, is_solved: true })
    setAnswers(answers.map(a => a.id === answerId ? { ...a, is_accepted: true } : a))
    
    // Mark answer accepted
    await supabase.from('answers').update({ is_accepted: true }).eq('id', answerId)
    // Mark post solved
    await supabase.from('qa_posts').update({ is_solved: true }).eq('id', post.id)

    // Give 10 points to answer author
    const targetAnswer = answers.find(a => a.id === answerId)
    if (targetAnswer?.author_id) {
      try { await supabase.rpc('increment_user_points', { user_id: targetAnswer.author_id, amount: 10 }) } catch {}
    }
    
    toast.success('Answer accepted! 10 points awarded to the author.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!post) {
    return <div className="text-center py-20">Question not found.</div>
  }

  const subjectColor = SUBJECT_COLORS[post.subject] || SUBJECT_COLORS.Other

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/qa">
        <Button variant="ghost" className="text-slate-500 -ml-4 hover:bg-transparent hover:text-indigo-600">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Q&A Board
        </Button>
      </Link>

      {/* QUESTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex gap-4 md:gap-6">
          {/* Mobile Upvote Hide, Desktop Show */}
          <div className="hidden md:flex flex-col items-center shrink-0 w-12">
            <button 
              onClick={handleQuestionUpvote}
              disabled={hasUpvoted || !user || user.id === post.author_id}
              className={`p-2 rounded-full mb-2 transition-colors ${
                hasUpvoted ? 'text-indigo-600 bg-indigo-50' : 
                user && user.id !== post.author_id ? 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-8 h-8" />
            </button>
            <span className={`font-bold text-xl ${hasUpvoted ? 'text-indigo-600' : 'text-slate-600'}`}>
              {upvotes}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className={`${subjectColor} border-none font-medium text-xs`}>
                {post.subject}
              </Badge>
              {post.is_solved && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </Badge>
              )}
              <span className="text-xs text-slate-500 ml-auto flex items-center gap-2">
                 {/* Mobile Upvote Inline */}
                <span className="md:hidden flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                   <ArrowUp className="w-3 h-3"/> {upvotes}
                </span>
                Asked {timeAgo(post.created_at)}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {post.title}
            </h1>

            <div className="prose prose-slate max-w-none mb-8">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl border border-slate-200 text-sm"
                      />
                    ) : (
                      <code {...props} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <div className="bg-indigo-50/50 rounded-xl p-3 flex items-center gap-3 border border-indigo-50">
                <span className="text-xs text-slate-500">Asked by</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback style={{ backgroundColor: post.author?.avatar_color || '#cbd5e1', color: 'white', fontSize: '12px' }}>
                      {getInitials(post.author?.display_name || '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-slate-700">{post.author?.display_name || 'Anonymous'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ANSWERS HEADER */}
      <div className="flex items-center gap-2 text-xl font-bold text-slate-900 pt-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        <MessageSquare className="w-6 h-6 text-indigo-500" />
        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
      </div>

      {/* ANSWERS LIST */}
      <div className="space-y-4">
        {answers.map(answer => (
          <AnswerCard 
            key={answer.id}
            answer={answer}
            questionAuthorId={post.author_id}
            currentUser={user}
            onAccept={handleAcceptAnswer}
            isQuestionSolved={post.is_solved}
          />
        ))}
      </div>

      {/* WRITE ANSWER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 font-sans">Your Answer</h3>
        {user ? (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <Textarea 
              placeholder="Write your answer here. Markdown is supported for code blocks and formatting..." 
              className="min-h-[150px] font-mono text-sm leading-relaxed border-slate-300 focus-visible:ring-indigo-500"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500 hidden sm:block">
                Tip: Use ```language for code blocks. Good answers get upvoted!
              </p>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting || !newAnswer.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Post Answer
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
            <p className="text-slate-600 mb-3">Please log in to answer this question.</p>
            <Link href={`/login?redirectTo=/qa/${id}`}>
              <Button variant="outline">Log in</Button>
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}

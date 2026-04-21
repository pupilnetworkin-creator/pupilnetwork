'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowUp, CheckCircle, Check } from 'lucide-react'
import { getInitials, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { User } from '@supabase/supabase-js'

interface AnswerCardProps {
  answer: {
    id: string
    content: string
    upvotes: number
    is_accepted: boolean
    created_at: string
    author_id: string
    author?: {
      display_name: string
      avatar_color: string
    } | null
  }
  questionAuthorId: string
  currentUser: User | null
  onAccept: (answerId: string) => void
  isQuestionSolved: boolean
}

export function AnswerCard({ answer, questionAuthorId, currentUser, onAccept, isQuestionSolved }: AnswerCardProps) {
  const [upvotes, setUpvotes] = useState(answer.upvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  const supabase = createClient()

  const isQuestionAuthor = currentUser?.id === questionAuthorId

  async function handleUpvote() {
    if (!currentUser) {
      toast.error('You must log in to upvote.')
      return
    }
    if (hasUpvoted || upvoting || currentUser.id === answer.author_id) return

    setUpvoting(true)
    const newUpvotes = upvotes + 1
    setUpvotes(newUpvotes)
    setHasUpvoted(true)

    // Update answer upvotes
    try {
      await supabase.rpc('increment_answer_upvotes', { answer_id: answer.id })
    } catch {
      await supabase.from('answers').update({ upvotes: newUpvotes }).eq('id', answer.id)
    }
    
    // Add 1 point to answer author
    if (answer.author_id) {
      try { await supabase.rpc('increment_user_points', { user_id: answer.author_id, amount: 1 }) } catch {}
    }

    setUpvoting(false)
  }

  return (
    <div className={`p-5 rounded-xl border ${answer.is_accepted ? 'border-green-300 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex gap-4">
        {/* Left Col: Upvotes */}
        <div className="flex flex-col items-center shrink-0 w-10">
          <button 
            onClick={handleUpvote}
            disabled={hasUpvoted || !currentUser || currentUser.id === answer.author_id}
            className={`p-2 rounded-full mb-1 transition-colors ${
              hasUpvoted ? 'text-indigo-600 bg-indigo-50' : 
              currentUser && currentUser.id !== answer.author_id ? 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <span className={`font-bold text-lg ${hasUpvoted ? 'text-indigo-600' : 'text-slate-600'}`}>
            {upvotes}
          </span>
          {answer.is_accepted && (
            <div className="mt-4 text-green-500" title="Accepted Answer">
              <CheckCircle className="w-8 h-8 fill-green-100" />
            </div>
          )}
        </div>

        {/* Right Col: Content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-slate max-w-none mb-6">
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
                      className="rounded-lg border border-slate-200 !mt-2 !mb-4 text-sm"
                    />
                  ) : (
                    <code {...props} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  )
                }
              }}
            >
              {answer.content}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between">
            {/* Accept Button for Author */}
            {isQuestionAuthor && !isQuestionSolved && !answer.is_accepted ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAccept(answer.id)}
                className="text-green-700 border-green-200 hover:bg-green-50 gap-1.5 h-8"
              >
                <Check className="w-3.5 h-3.5" /> Accept Answer
              </Button>
            ) : <div />}

            {/* Author Info */}
            <div className="bg-slate-50 rounded-lg p-2.5 flex items-center gap-3 border border-slate-100">
              <span className="text-xs text-slate-500">{timeAgo(answer.created_at)}</span>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback style={{ backgroundColor: answer.author?.avatar_color || '#cbd5e1', color: 'white', fontSize: '10px' }}>
                    {getInitials(answer.author?.display_name || '?')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700">{answer.author?.display_name || 'Anonymous'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

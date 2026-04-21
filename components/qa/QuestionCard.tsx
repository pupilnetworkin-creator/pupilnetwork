'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpCircle, MessageCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { SUBJECT_COLORS, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface QuestionCardProps {
  post: {
    id: string
    title: string
    subject: string
    upvotes: number
    answer_count: number
    is_solved: boolean
    created_at: string
    author_id?: string
    author?: { display_name: string } | null
  }
  currentUserId?: string | null
  onDeleted?: (id: string) => void
}

export function QuestionCard({ post, currentUserId, onDeleted }: QuestionCardProps) {
  const supabase = createClient()
  const subjectColor = SUBJECT_COLORS[post.subject] || SUBJECT_COLORS.Other
  const isOwner = currentUserId && post.author_id === currentUserId

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    const { error } = await supabase
      .from('qa_posts')
      .delete()
      .eq('id', post.id)
      .eq('author_id', currentUserId!)

    if (error) {
      toast.error('Failed to delete question.')
      return
    }
    toast.success('Question deleted.')
    onDeleted?.(post.id)
  }

  return (
    <div className="relative group">
      <Link href={`/qa/${post.id}`}>
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardContent className="p-5">
            <div className="flex gap-4">
              {/* Left: Upvotes */}
              <div className="hidden sm:flex flex-col items-center shrink-0 w-12 py-1">
                <ArrowUpCircle className="w-8 h-8 text-slate-300 mb-1" />
                <span className="font-bold text-slate-700">{post.upvotes}</span>
              </div>

              {/* Right: Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={`${subjectColor} border-none font-medium px-2 py-0 h-5`}>
                    {post.subject}
                  </Badge>
                  {post.is_solved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium px-2 py-0 h-5 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Solved
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
                    {timeAgo(post.created_at)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-snug line-clamp-2 pr-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {post.title}
                </h3>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {post.author?.display_name?.charAt(0) || '?'}
                    </div>
                    <span className="truncate max-w-[120px]">{post.author?.display_name || 'Anonymous'}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex sm:hidden items-center gap-1 text-slate-500 text-sm font-medium">
                      <ArrowUpCircle className="w-4 h-4" /> {post.upvotes}
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${post.answer_count > 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.answer_count} answer{post.answer_count !== 1 && 's'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Delete button — only for owner, floats top-right */}
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
              title="Delete question"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
            >
              <Trash2 className="w-4 h-4" />
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this question?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{post.title}" and all its answers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

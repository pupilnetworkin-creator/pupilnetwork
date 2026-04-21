'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Video, Trash2 } from 'lucide-react'
import { SUBJECT_COLORS, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface RoomCardProps {
  room: {
    id: string
    name: string
    subject: string
    description: string | null
    member_count: number
    created_at: string
    creator?: { id: string; display_name: string } | null
  }
  currentUserId?: string | null
  onDeleted?: (id: string) => void
}

export function RoomCard({ room, currentUserId, onDeleted }: RoomCardProps) {
  const supabase = createClient()
  const subjectColor = SUBJECT_COLORS[room.subject] || SUBJECT_COLORS.Other
  const isOwner = currentUserId && room.creator?.id === currentUserId

  async function handleDelete() {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', room.id)
      .eq('created_by', currentUserId!)

    if (error) {
      toast.error('Failed to delete room.')
      return
    }
    toast.success('Room deleted.')
    onDeleted?.(room.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className={`${subjectColor} border-none font-medium px-2.5 py-0.5`}>
            {room.subject}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-slate-500 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />
              {room.member_count}
            </div>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete room"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{room.name}" will be removed for all members. This cannot be undone.
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
        </div>

        <h3 className="font-semibold text-slate-900 text-lg mb-1 leading-tight line-clamp-1">
          {room.name}
        </h3>

        {room.description ? (
          <p className="text-sm text-slate-600 line-clamp-2 h-10 mb-4">
            {room.description}
          </p>
        ) : (
          <div className="h-10 mb-4" />
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <span>By {room.creator?.display_name || 'Anonymous'}</span>
          <span>{timeAgo(room.created_at)}</span>
        </div>

        <Link href={`/rooms/${room.id}`}>
          <Button className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors">
            <span className="flex items-center gap-2">
              Join Room <Video className="w-4 h-4 ml-1 opacity-50" />
            </span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

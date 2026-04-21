import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DirectChat } from '@/components/social/DirectChat'

export default async function DirectChatPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const friendId = params.id
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if they are friends (status = 'accepted')
  const { data: friendship, error } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
    .eq('status', 'accepted')
    .single()

  if (error || !friendship) {
    // In a real app, you might want to show a "You are not friends" message
    // but for now let's just redirect or 404
    redirect('/friends')
  }

  // Get friend's profile
  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('display_name, avatar_color, username')
    .eq('id', friendId)
    .single()

  if (!friendProfile) return notFound()

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto w-full -mt-4 py-4 px-2 sm:px-4">
      <DirectChat 
        friendId={friendId} 
        currentUserId={user.id} 
        friendProfile={friendProfile} 
      />
    </div>
  )
}

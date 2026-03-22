"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { Send, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default function DMPage() {
  const params = useParams();
  const router = useRouter();
  const friendId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [friend, setFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get Session — reads from local cache, no timeout needed
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        setUser(session.user);

        // 2. Fetch Friend Profile
        const { data: friendData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", friendId)
          .single();
        if (friendData) setFriend(friendData);

        // 3. Fetch Initial Messages
        const { data: msgData } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
          .order("created_at", { ascending: true });

        if (msgData) {
          const filtered = msgData.filter((m: any) => 
            (m.sender_id === session.user.id && m.receiver_id === friendId) ||
            (m.sender_id === friendId && m.receiver_id === session.user.id)
          );
          setMessages(filtered);

          // 4. Mark unread messages as read
          const unreadIds = filtered
            .filter((m: any) => m.receiver_id === session.user.id && !m.is_read)
            .map((m: any) => m.id);
          if (unreadIds.length > 0) {
            await supabase.from("direct_messages").update({ is_read: true }).in("id", unreadIds);
          }
        }

      } catch (e) {
        console.error("DM Init error:", e);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Subscribe to new DMs
    const channel = supabase
      .channel(`user_dms_${friendId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'direct_messages' 
      }, (payload) => {
        const msg = payload.new;
        const currentUserId = userRef.current?.id;
        if (
          (msg.sender_id === currentUserId && msg.receiver_id === friendId) ||
          (msg.sender_id === friendId && msg.receiver_id === currentUserId)
        ) {
          setMessages((current) => {
            if (current.some(m => m.id === msg.id)) return current;
            return [...current, msg];
          });
          if (msg.receiver_id === currentUserId) {
            supabase.from("direct_messages").update({ is_read: true }).eq("id", msg.id).then();
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        const updated = payload.new;
        if (updated.is_read) {
          setMessages(current => current.map(m => m.id === updated.id ? { ...m, is_read: true } : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [sendError, setSendError] = useState<string | null>(null);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    setSendError(null);
    try {
      // Ensure current user has a profile (required by FK constraint on direct_messages)
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!myProfile) {
        // Auto-create a minimal profile so messages can be sent
        await supabase.from("profiles").insert({
          id: user.id,
          username: user.email?.split("@")[0] || `user_${user.id.slice(0, 6)}`,
          points: 0,
          is_premium: false
        });
      }

      const { error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          message: newMessage.trim()
        });

      if (error) {
        setSendError(error.message);
        console.error("Send error:", error);
      } else {
        setNewMessage("");
      }
    } catch (e: any) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] mt-4 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/friends" className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <img src={friend?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendId}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-800 border-2 border-pink-500/20" />
          <div>
            <h2 className="text-white font-bold leading-none">{friend?.username || "Chatting..."}</h2>
            {friend?.last_seen_at && (new Date().getTime() - new Date(friend.last_seen_at).getTime() < 1000 * 60 * 5) ? (
              <p className="text-[10px] text-green-500 mt-1 uppercase tracking-widest font-bold">Online Now</p>
            ) : (
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                Last seen {friend?.last_seen_at ? new Date(friend.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
             <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
               <User size={32} />
             </div>
             <p className="text-gray-500">Say hi to your friend!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                msg.sender_id === user?.id 
                  ? 'bg-pink-600 text-white rounded-tr-none border border-pink-500' 
                  : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                <p className={`text-[9px] mt-1 opacity-60 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-md">
        {sendError && (
          <p className="text-xs text-red-400 mb-2 px-1">⚠️ Failed to send: {sendError}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:bg-gray-700 text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/10"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

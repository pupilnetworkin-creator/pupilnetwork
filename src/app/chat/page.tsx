"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Search, MessageCircle, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        setUser(session.user);

        // Fetch Friends with presence
        const { data: friendsData } = await supabase
          .from("friends")
          .select("friend_id, profiles!friend_id(username, avatar_url, points)")  // add last_seen_at after SQL migration
          .eq("user_id", session.user.id);

        if (friendsData) {
          // Sort online friends first
          const mapped = friendsData.map((f: any) => ({
            id: f.friend_id,
            ...f.profiles,
            isOnline: !!(f.profiles?.last_seen_at) && (new Date().getTime() - new Date(f.profiles.last_seen_at).getTime() < 1000 * 60 * 5)
          })).sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));

          setFriends(mapped);
        }
      } catch (e) {
        console.error("Chat init error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Subscribe to profile changes for real-time presence
    const channel = supabase.channel('chat_presence')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        init(); // Refresh on profile update
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const filteredFriends = friends.filter(f => 
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Header & Stats */}
        <div className="md:w-1/3 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full group-hover:bg-pink-500/20 transition-all"></div>
            <h1 className="text-4xl font-black text-white mb-2 ml-1">Messages</h1>
            <p className="text-gray-400 text-sm mb-6">Connect with your study group in real-time.</p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Find a friend..."
                className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles size={16} />
                <span className="font-bold text-sm">Active Now</span>
              </div>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">
                {friends.filter(f => f.isOnline).length} online
              </span>
            </div>

            {friends.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {friends.map(f => (
                  <Link key={f.id} href={`/dm/${f.id}`} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="relative flex-shrink-0">
                      <img
                        src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`}
                        alt={f.username}
                        className="w-9 h-9 rounded-full bg-gray-800 ring-2 ring-indigo-500/20"
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${f.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors">{f.username}</p>
                      <p className={`text-[10px] font-medium ${f.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                        {f.isOnline ? '● Online' : '○ Offline'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-indigo-400/60 text-xs">No friends yet</p>
                <Link href="/friends" className="text-xs text-indigo-400 underline mt-1 inline-block">Find people →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Friend List */}
        <div className="md:w-2/3 space-y-4">
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFriends.map((friend) => (
                <Link 
                  key={friend.id} 
                  href={`/dm/${friend.id}`}
                  className="flex items-center gap-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 p-5 rounded-[24px] transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="relative">
                    <img 
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} 
                      alt="avatar" 
                      className="w-14 h-14 rounded-2xl bg-gray-800 object-cover shadow-lg group-hover:shadow-pink-500/10 transition-shadow"
                    />
                    {friend.isOnline && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-900 shadow-sm animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate group-hover:text-pink-400 transition-colors">{friend.username}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {friend.isOnline ? 'Online Now' : 'Tap to message'}
                    </p>
                  </div>
                  <div className="p-2 bg-gray-800 group-hover:bg-pink-600 rounded-xl transition-colors">
                    <MessageCircle size={20} className="text-gray-400 group-hover:text-white" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[32px] p-12 text-center">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={32} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No friends found</h3>
              <p className="text-gray-500 mb-6 max-w-xs mx-auto">Start connecting with other students in the community tab to begin chatting!</p>
              <Link href="/friends" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">
                Find Friends
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

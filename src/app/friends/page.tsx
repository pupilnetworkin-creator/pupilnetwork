"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Search, UserPlus, Users as UsersIcon, UserCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // Incoming requests
  const [sentRequests, setSentRequests] = useState<any[]>([]); // Outgoing requests I sent
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();

  const fetchFriendsAndRequests = async (currentUserId: string) => {
    try {
      // ── 1. Friends ─────────────────────────────────────────────────────────
      const { data: friendsData, error: friendsErr } = await supabase
        .from("friends")
        .select("id, friend_id")
        .eq("user_id", currentUserId);
      
      // ── 2. Incoming Requests (IDs only, no profile join) ───────────────────
      const { data: incomingData, error: incomingErr } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      // ── 3. Outgoing Requests (IDs only, no profile join) ───────────────────
      const { data: sentData, error: sentErr } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("sender_id", currentUserId)
        .eq("status", "pending");

      // Log for debug
      if (incomingErr) console.error("Incoming requests error:", incomingErr);
      if (sentErr) console.error("Sent requests error:", sentErr);
      if (friendsErr) console.error("Friends error:", friendsErr);

      // ── 4. Collect all unique profile IDs we need ─────────────────────────
      const profileIds = new Set<string>();
      (friendsData || []).forEach(f => profileIds.add(f.friend_id));
      (incomingData || []).forEach(r => profileIds.add(r.sender_id));
      (sentData || []).forEach(s => profileIds.add(s.receiver_id));

      // ── 5. Fetch all needed profiles in one request ───────────────────────
      let profileMap: Record<string, any> = {};
      if (profileIds.size > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, points")  // last_seen_at added via SQL migration
          .in("id", Array.from(profileIds));
        
        if (profilesErr) console.error("Profiles lookup error:", profilesErr);
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      // ── 6. Merge data ──────────────────────────────────────────────────────
      setFriends(
        (friendsData || []).map((f: any) => ({
          friend_id: f.friend_id,
          ...(profileMap[f.friend_id] || { username: "Unknown", avatar_url: null, points: 0 })
        }))
      );

      setRequests(
        (incomingData || []).map((r: any) => ({
          request_id: r.id,
          sender_id: r.sender_id,
          ...(profileMap[r.sender_id] || { username: "Unknown", avatar_url: null, points: 0 })
        }))
      );

      setSentRequests(
        (sentData || []).map((s: any) => ({
          request_id: s.id,
          receiver_id: s.receiver_id,
          ...(profileMap[s.receiver_id] || { username: "Unknown", avatar_url: null, points: 0 })
        }))
      );

    } catch (e) {
      console.error("Fetch friends/requests error:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        setUser(session.user);
        await fetchFriendsAndRequests(session.user.id);
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, points")
      .ilike("username", `%${searchQuery}%`)
      .neq("id", user?.id)
      .limit(10);

    setSearchResults(data || []);
    setSearchLoading(false);
  };

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("friend_requests")
      .insert({ sender_id: user.id, receiver_id: targetId });
    
    if (error) {
      alert(error.message);
    } else {
      alert("Request sent!");
    }
  };

  const handleRequest = async (requestId: string, senderId: string, accept: boolean) => {
    if (!user) return;

    if (accept) {
      // Insert our side of the friendship (upsert to avoid duplicate errors)
      await supabase
        .from("friends")
        .upsert({ user_id: user.id, friend_id: senderId }, { ignoreDuplicates: true });

      // Also try inserting the reverse row (works if RLS allows it, or if DB trigger isn't set up)
      await supabase
        .from("friends")
        .upsert({ user_id: senderId, friend_id: user.id }, { ignoreDuplicates: true });

      // Always delete the request regardless (clean up)
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

    } else {
      await supabase.from("friend_requests").delete().eq("id", requestId);
    }

    await fetchFriendsAndRequests(user.id);
  };

  if (loading) {
     return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <UsersIcon className="text-green-500" /> Community
        </h1>
        <p className="text-gray-400">Connect with classmates and study together.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Find People</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search username..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Search size={20} />
              </button>
            </form>

            {searchLoading && <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>}

            <div className="mt-6 space-y-3">
              {searchResults.map((result) => {
                const isFriend = friends.some((f: any) => f.friend_id === result.id);
                // hasPending: request received FROM them OR sent BY me TO them
                const hasPendingIncoming = requests.some((r: any) => r.sender_id === result.id);
                const hasPendingSent = sentRequests.some((s: any) => s.receiver_id === result.id);
                const hasPending = hasPendingIncoming || hasPendingSent;
                return (
                  <div key={result.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3">
                      <img src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.id}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-700" />
                      <div>
                        <p className="text-white font-medium text-sm">{result.username}</p>
                        <p className="text-[10px] text-yellow-500 font-bold">{result.points} pts</p>
                      </div>
                    </div>
                    {!isFriend && !hasPending && (
                      <button onClick={() => sendRequest(result.id)} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        <UserPlus size={16} />
                      </button>
                    )}
                    {hasPendingSent && <span className="text-[10px] text-blue-400 font-bold mr-1 bg-blue-500/10 px-2 py-1 rounded-full">Pending</span>}
                    {hasPendingIncoming && <span className="text-[10px] text-orange-400 font-bold mr-1 bg-orange-500/10 px-2 py-1 rounded-full">Respond!</span>}
                    {isFriend && <UserCheck size={16} className="text-green-500 mr-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Column: Requests (Incoming + Outgoing) */}
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">📥 Incoming Requests</h2>
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.request_id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={req.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender_id}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-700" />
                      <div>
                        <p className="text-white font-bold text-sm">{req.username}</p>
                        <p className="text-xs text-gray-400">wants to study with you</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRequest(req.request_id, req.sender_id, true)} 
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold"
                      >
                        ✓ Accept
                      </button>
                      <button 
                        onClick={() => handleRequest(req.request_id, req.sender_id, false)} 
                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold"
                      >
                        ✗ Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-800 rounded-xl">
                <p className="text-gray-600 text-sm">No incoming requests</p>
              </div>
            )}
          </div>

          {/* Sent Requests - so you know who you're waiting on */}
          {sentRequests.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-base font-bold text-gray-400 mb-3">📤 Sent & Awaiting</h2>
              <div className="space-y-2">
                {sentRequests.map((s) => (
                  <div key={s.request_id} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-800">
                    <img src={s.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.receiver_id}`} alt="avatar" className="w-9 h-9 rounded-full bg-gray-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{s.username}</p>
                      <p className="text-[10px] text-gray-500">Waiting for response...</p>
                    </div>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full font-bold">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Friends */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">My Friends</h2>
          {friends.length > 0 ? (
            <div className="space-y-4">
              {friends.map((friend) => {
                const isOnline = !!(friend.last_seen_at) && (new Date().getTime() - new Date(friend.last_seen_at).getTime() < 1000 * 60 * 5);
                return (
                  <div key={friend.friend_id} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-800 group hover:border-pink-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.friend_id}`} alt="avatar" className="w-12 h-12 rounded-full bg-gray-700" />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold flex items-center gap-2">
                          {friend.username}
                          {isOnline && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</span>}
                        </p>
                        <p className="text-xs text-yellow-500 font-bold">{friend.points} points</p>
                      </div>
                    </div>
                    <Link href={`/dm/${friend.friend_id}`} className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all active:scale-95">
                      <MessageCircle size={18} />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500 text-sm">Find classmates to start chatting!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import ChatBox from "../../../components/ChatBox";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen, Lock, Crown, Trash2, Clock } from "lucide-react";

export default function RoomDetailPage() {
  const { id } = useParams() as { id: string };
  const [room, setRoom] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFull, setIsFull] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const router = useRouter();

  const deleteRoom = async () => {
    if (!confirm("Delete this room? All messages and members will be removed permanently.")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) { router.push("/rooms"); }
    else { alert("Failed to delete: " + error.message); setIsDeleting(false); }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);

      // Fetch profile for premium status
      const { data: profile } = await supabase
        .from("profiles").select("is_premium").eq("id", session.user.id).single();
      const premium = !!profile?.is_premium;
      setIsPremium(premium);

      // Fetch room details
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*, profiles(username)")
        .eq("id", id)
        .single();
      if (roomData) setRoom(roomData);

      // Fetch member count
      const { count } = await supabase
        .from("room_members")
        .select("*", { count: 'exact', head: true })
        .eq("room_id", id);
      const currentCount = count ?? 0;
      setMemberCount(currentCount);

      // Check if room is full (maxMembers from room or default 10/50)
      const maxM = roomData?.max_members ?? (premium ? 50 : 10);
      const isMember = await supabase.from("room_members")
        .select("user_id").eq("room_id", id).eq("user_id", session.user.id).single();
      // Room is full only if user isn't already in it and count >= limit
      if (!isMember.data && currentCount >= maxM) setIsFull(true);

      setLoading(false);
    };
    if (id) init();
  }, [id, router]);

  // Realtime listener to kick users out if the room is deleted (manually or automatically)
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`room_status_${id}`)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${id}` }, () => {
        alert("This room has been closed and deleted.");
        router.push("/rooms");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, router]);

  // Automatic Room Expiration Timer
  useEffect(() => {
    if (!room || !room.duration_minutes) return;

    const createdAt = new Date(room.created_at).getTime();
    const expiresAt = createdAt + room.duration_minutes * 60000;

    const checkExpiration = async () => {
      const remaining = expiresAt - Date.now();
      
      if (remaining <= 0) {
        setTimeLeft("Expired");
        alert("This study session's time has expired! The room is closing.");
        
        // If the current user is the host, delete the room from the database
        if (user && room.created_by === user.id) {
          await supabase.from("rooms").delete().eq("id", room.id);
        }
        router.push("/rooms");
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`Ends in ${m}m ${s}s`);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [room, user, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  if (!room) {
    return <div className="flex justify-center py-12 text-gray-400">Room not found.</div>;
  }

  const maxMembers = room.max_members ?? 10;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Rooms
      </Link>
      
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            {room.name}
            {room.is_private && <Lock size={16} className="text-yellow-500" />}
          </h1>
          {room.topic && (
            <p className="text-sm text-blue-400 mt-1 flex items-center gap-1.5 font-medium">
              <BookOpen size={13} /> {room.topic}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Users size={14} />
              <span>By {room.profiles?.username || 'Unknown'}</span>
            </p>
            {room.duration_minutes && timeLeft && (
              <p className={`text-sm flex items-center gap-1 font-semibold ${timeLeft === "Expired" ? "text-red-400" : "text-indigo-400"}`}>
                <Clock size={13} className={timeLeft !== "Expired" ? "animate-pulse" : ""} /> {timeLeft}
              </p>
            )}
            <span className={memberCount >= maxMembers ? "text-red-400 font-bold text-sm" : "text-gray-500 text-sm"}>
              {memberCount}/{maxMembers} members
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isPremium && (
            <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-full font-bold">
              <Crown size={12} /> Premium
            </span>
          )}
          {/* Delete button — host only */}
          {user && room.created_by === user.id && (
            <button
              onClick={deleteRoom}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              <Trash2 size={14} /> {isDeleting ? "Deleting..." : "Delete Room"}
            </button>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      <div className="h-1 bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${memberCount >= maxMembers ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min((memberCount / maxMembers) * 100, 100)}%` }}
        />
      </div>

      {isFull ? (
        <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Users size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Room is Full</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            This room has reached its {maxMembers}-member limit.
            {!isPremium && " Upgrade to Premium to create rooms with up to 50 members!"}
          </p>
          {!isPremium && (
            <Link href="/upgrade" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all">
              <Crown size={16} /> Upgrade to Premium
            </Link>
          )}
          <div>
            <Link href="/rooms" className="text-sm text-gray-500 hover:text-white transition-colors">← Back to Rooms</Link>
          </div>
        </div>
      ) : (
        <ChatBox 
          roomId={room.id} 
          user={user} 
          roomTopic={room.topic} 
          isPremium={isPremium}
          maxMembers={maxMembers}
          isHost={user?.id === room.created_by}
          username={user?.email?.split("@")[0] || "PupilNetwork User"}
        />
      )}
    </div>
  );
}

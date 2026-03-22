"use client";

import Link from "next/link";
import { Users, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function RoomCard({ room }: { room: any }) {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const maxMembers = room.max_members ?? 10;

  useEffect(() => {
    const fetch = async () => {
      const { count } = await supabase
        .from("room_members")
        .select("*", { count: 'exact', head: true })
        .eq("room_id", room.id);
      setMemberCount(count ?? 0);
    };
    fetch();

    // Realtime updates to member count
    const channel = supabase.channel(`room_card_${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` }, () => {
        fetch();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  const isFull = memberCount !== null && memberCount >= maxMembers;
  const pct = memberCount !== null ? Math.min((memberCount / maxMembers) * 100, 100) : 0;

  return (
    <motion.div 
      whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-gray-900 border border-gray-800 p-6 rounded-2xl transition-colors flex flex-col h-full group"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{room.name}</h3>
          <div className="flex gap-1.5 flex-shrink-0 mt-1">
            {room.is_private && (
              <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold">
                <Lock size={9} /> Private
              </span>
            )}
            {isFull && (
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">Full</span>
            )}
          </div>
        </div>

        {room.topic && (
          <p className="text-xs text-blue-400 mb-2 font-medium">📚 {room.topic}</p>
        )}

        <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
          <Users size={12} /> {room.profiles?.username || 'Unknown'}
        </p>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Members</span>
            <span className={isFull ? "text-red-400 font-bold" : ""}>{memberCount ?? "…"}/{maxMembers}</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <Link 
        href={`/rooms/${room.id}`}
        className={`mt-4 w-full block text-center py-2 rounded-lg font-medium transition-colors ${
          isFull 
            ? "bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none" 
            : "bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white"
        }`}
      >
        {isFull ? "Room Full" : "Join Room →"}
      </Link>
    </motion.div>
  );
}

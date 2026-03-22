"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, MessageSquare, Users, Award, Trophy, Brain } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // Step 1: Auth — reads from local cache, no timeout needed
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }
        setUser(session.user);
      } catch (err: any) {
        console.error("Auth check failed:", err?.message);
        router.push("/login");
        return;
      } finally {
        setLoading(false);
      }

      // Step 2: Data fetches are optional — failures show empty state, not crash
      const dataTimeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

      try {
        const [rRes] = await Promise.race([
          Promise.all([
            supabase.from("rooms").select("*, profiles(username)").order("created_at", { ascending: false }).limit(3)
          ]),
          dataTimeout(8000).then(() => [null])
        ]) as any;
        if (rRes?.data) setRooms(rRes.data);
      } catch (e) {
        console.warn("Rooms fetch failed silently:", e);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.email?.split('@')[0]}!</p>
        </div>
        {/* Quick links section removed */}
      </div>

      {/* Updated Dashboard Grid */}
      <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Link href="/rooms" className="group relative bg-[#0a0a0a] border border-gray-800 p-6 rounded-[24px] hover:border-blue-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
          <div className="bg-gray-900 border border-gray-800 h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-blue-500/30 transition-colors">
            <BookOpen className="text-blue-400 group-hover:scale-110 transition-transform relative z-10" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 decoration-blue-400 group-hover:underline underline-offset-4">Join Room</h3>
          <p className="text-sm text-gray-400 font-medium">Find active study sessions to collaborate.</p>
        </Link>
        <Link href="/rooms" className="group relative bg-[#0a0a0a] border border-gray-800 p-6 rounded-[24px] hover:border-purple-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>
          <div className="bg-gray-900 border border-gray-800 h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-purple-500/30 transition-colors">
            <MessageSquare className="text-purple-400 group-hover:scale-110 transition-transform relative z-10" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 decoration-purple-400 group-hover:underline underline-offset-4">Create Room</h3>
          <p className="text-sm text-gray-400 font-medium">Start a new focus room for your subject.</p>
        </Link>

        <Link href="/friends" className="group relative bg-[#0a0a0a] border border-gray-800 p-6 rounded-[24px] hover:border-pink-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(236,72,153,0.2)] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 blur-[40px] rounded-full group-hover:bg-pink-500/20 transition-all"></div>
          <div className="bg-gray-900 border border-gray-800 h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-pink-500/30 transition-colors">
            <Users className="text-pink-400 group-hover:scale-110 transition-transform relative z-10" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 decoration-pink-400 group-hover:underline underline-offset-4">Connect</h3>
          <p className="text-sm text-gray-400 font-medium">Match with classmates to study securely.</p>
        </Link>
        <Link href="/leaderboard" className="group relative bg-[#0a0a0a] border border-gray-800 p-6 rounded-[24px] hover:border-yellow-500/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.2)] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/10 blur-[40px] rounded-full group-hover:bg-yellow-500/20 transition-all"></div>
          <div className="bg-gray-900 border border-gray-800 h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-yellow-500/30 transition-colors">
            <Trophy className="text-yellow-400 group-hover:scale-110 transition-transform relative z-10" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 decoration-yellow-400 group-hover:underline underline-offset-4">Rankings</h3>
          <p className="text-sm text-gray-400 font-medium">See the top globally contributing students.</p>
        </Link>
        <button 
          onClick={() => {
             const botBtn = document.getElementById("ai-widget-trigger");
             if(botBtn) botBtn.click();
             else alert("Click the floating AI Study Buddy icon in the bottom right corner!");
          }}
          className="text-left relative group bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-indigo-500/40 p-6 rounded-[24px] hover:border-indigo-400 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)] overflow-hidden">
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-500/30 transition-all pointer-events-none"></div>
          <div className="bg-indigo-950/80 border border-indigo-500/30 h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors relative z-10">
            <Brain className="text-indigo-400 group-hover:scale-110 transition-transform" size={28} />
          </div>
          <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2 relative z-10">Ask AI Buddy</h3>
          <p className="text-sm text-indigo-200/70 font-medium relative z-10">Get instant help and topic breakdowns.</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen size={20} className="text-blue-400"/> Recent Study Rooms</h2>
              <Link href="/rooms" className="text-sm text-blue-400 hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <Link key={room.id} href={`/rooms/${room.id}`} className="block p-4 bg-gray-950 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                    <h3 className="text-white font-bold">{room.name}</h3>
                    <p className="text-xs text-gray-500">By {room.profiles?.username || 'User'}</p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-950 rounded-xl border border-gray-800 border-dashed">
                  <p className="text-gray-400">No rooms active right now.</p>
                  <Link href="/rooms" className="mt-2 text-blue-400 inline-block text-sm hover:underline">Create the first one</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Users size={20} className="text-green-400"/> Friends</h2>
            <div className="text-center py-6 bg-gray-950 rounded-xl border border-gray-800 border-dashed">
              <p className="text-gray-400 text-sm mb-3">Grow your network</p>
              <Link href="/friends" className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium">
                Find Friends
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

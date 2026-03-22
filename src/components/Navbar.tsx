"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { LogOut, User, Users, MessageSquare, Trophy, Home, Sparkles, BookOpen, FileText } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data } = await supabase.auth.getSession() as any;
      const session = data?.session;
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // 1. Fetch Premium Status
        const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", session.user.id).single();
        if (profile?.is_premium) setIsPremium(true);

        // 2. Initial Notification Check
        const { count: reqCount } = await supabase.from("friend_requests").select("*", { count: 'exact', head: true }).eq("receiver_id", session.user.id).eq("status", "pending");
        const { count: dmCount } = await supabase.from("direct_messages").select("*", { count: 'exact', head: true }).eq("receiver_id", session.user.id).eq("is_read", false);
        setHasNotifications((reqCount || 0) > 0 || (dmCount || 0) > 0);
      }
    };
    
    fetchUserAndNotifications();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("is_premium").eq("id", session.user.id).single();
        setIsPremium(!!data?.is_premium);
      } else {
        setIsPremium(false);
        setHasNotifications(false);
      }
    });

    // Real-time notification listener
    const channel = supabase.channel('navbar_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests' }, () => setHasNotifications(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => setHasNotifications(true))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friend_requests' }, () => {
         // Re-check on update (like accept/reject)
         const check = async () => {
           const { data: { session } } = await supabase.auth.getSession();
           if (session?.user) {
             const { count: reqCount } = await supabase.from("friend_requests").select("*", { count: 'exact', head: true }).eq("receiver_id", session.user.id).eq("status", "pending");
             const { count: dmCount } = await supabase.from("direct_messages").select("*", { count: 'exact', head: true }).eq("receiver_id", session.user.id).eq("is_read", false);
             setHasNotifications((reqCount || 0) > 0 || (dmCount || 0) > 0);
           }
         };
         check();
      })
      .subscribe();

    // Heartbeat: Update 'last_seen_at' every 2 minutes (requires SQL migration)
    const heartbeat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from("profiles")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", session.user.id);
        }
      } catch (_) {
        // Column may not exist yet — safe to ignore
      }
    };

    const interval = setInterval(heartbeat, 1000 * 60 * 2); // 2 mins
    heartbeat(); // Initial heartbeat

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="border-b border-gray-800 bg-black/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              PupilNetwork
            </Link>
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <Home size={16} /> Dashboard
                </Link>
                <Link href="/rooms" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <BookOpen size={16} /> Rooms
                </Link>
                <Link href="/notes" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <FileText size={16} /> Notes
                </Link>
                <Link href="/chat" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative">
                  <MessageSquare size={16} /> Chat
                  {hasNotifications && (
                    <span className="absolute top-1 right-0 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
                  )}
                </Link>
                <Link href="/questions" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <BookOpen size={16} /> Questions
                </Link>
                <Link href="/friends" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <Users size={16} /> Community
                </Link>
                <Link href="/leaderboard" className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  <Trophy size={16} /> Leaderboard
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {!isPremium ? (
                  <Link href="/upgrade" className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,165,0,0.3)]">
                    <Sparkles size={12} /> Go Premium
                  </Link>
                ) : (
                  <span className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded text-[10px] font-black tracking-widest shadow-[0_0_15px_rgba(255,165,0,0.4)]">
                    PRO
                  </span>
                )}
                <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors ml-2 relative">
                  <User size={18} />
                  {hasNotifications && (
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{user.email?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 p-2 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white text-sm font-medium px-3 py-2">
                  Log in
                </Link>
                <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

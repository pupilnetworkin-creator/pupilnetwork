"use client";

// TS Cache Purge
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import LeaderboardList from "../../components/LeaderboardList";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setError(null);
        setLoading(true);
        const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 12000));
        const query = supabase
          .from("profiles")
          .select("id, username, avatar_url, points")
          .order("points", { ascending: false })
          .limit(50);
        const { data } = await Promise.race([query, timeout]) as any;
        if (data) setUsers(data);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Connection to the server timed out. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // trigger effect refresh by re-running fetch
    supabase.from("profiles").select("id").limit(1).then(() => window.location.reload());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">🏆 Leaderboard</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">See who's helping out the most! Ask and answer questions to climb the ranks and earn points.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-lg mx-auto">
          <p className="text-red-400 font-mono mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-all border border-gray-700"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <LeaderboardList users={users} />
      )}
    </div>
  );
}

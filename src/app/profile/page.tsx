"use client";

// TS Cache Purge
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Save, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    console.log("🔍 Starting fetchProfile...");
    const startTime = Date.now();
    
    try {
      // 1. Get Session — reads from local cache, no timeout needed
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`✅ Session check finished in ${Date.now() - startTime}ms`);
      
      if (!session) {
        console.warn("⚠️ No session found, redirecting...");
        router.push("/login");
        return;
      }
      setUser(session.user);

      // 2. Get Profile - Use SELECT instead of SINGLE for extra safety
      console.log(`🛠 Fetching profile for ID: ${session.user.id}`);
      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id);

      const profileRes = await profilePromise as any;
      console.log(`✅ Profile fetch finished in ${Date.now() - startTime}ms`);
      
      if (profileRes?.error) throw profileRes.error;
      const profileData = profileRes?.data?.[0]; // Get first item from array (safer than .single())

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username || "");
      } else {
        console.warn("ℹ️ No profile record found, using email fallback.");
        setUsername(session.user.email?.split('@')[0] || "User");
      }
    } catch (err: any) {
      console.error("❌ Profile load error details:", err);
      setError(err.message === "timeout" 
        ? `Connection timed out after ${Date.now() - startTime}ms. Is your Supabase project active?` 
        : `Error: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  // Real-time username check
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      return;
    }

    const checkUsername = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      
      if (data) {
        setUsernameError("This username is already taken.");
      } else {
        setUsernameError(null);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username, profile?.username]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;
    setSaving(true);
    
    // Generate avatar seed based on username
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const { error } = await supabase
      .from("profiles")
      .update({ username, avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) {
      if (error.code === '23505') {
        setUsernameError("This username is already taken.");
      } else {
        console.error("Save error:", error.message);
      }
    } else {
      setProfile({ ...profile, username, avatar_url: avatarUrl });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button 
          onClick={() => fetchProfile()} 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <UserIcon className="text-blue-500" size={32} /> Your Profile
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 pb-8 border-b border-gray-800">
          <img src={profile?.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gray-800" />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">{profile?.username}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <div className="mt-4 px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg inline-block font-bold">
              {profile?.points} Points
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input
              type="text"
              required
              className={`w-full bg-gray-800 border ${usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {usernameError && (
              <p className="mt-2 text-sm text-red-500">{usernameError}</p>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving || !!usernameError || username === profile?.username}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

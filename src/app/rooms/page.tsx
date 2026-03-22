"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import RoomCard from "../../components/RoomCard";
import { Plus, BookOpen } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomDuration, setNewRoomDuration] = useState(25);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyRoomsCreated, setDailyRoomsCreated] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const router = useRouter();

  const DURATIONS = [
    { mins: 25, label: "25 min", desc: "Quick sprint" },
    { mins: 50, label: "50 min", desc: "Deep work", premium: true },
    { mins: 90, label: "90 min", desc: "Marathon", premium: true },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles").select("is_premium").eq("id", session.user.id).single();
          if (profileData?.is_premium) setIsPremium(true);

          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const { count } = await supabase.from("rooms")
            .select("*", { count: 'exact', head: true })
            .eq("created_by", session.user.id)
            .gte("created_at", startOfDay.toISOString());
          setDailyRoomsCreated(count || 0);
        }
      } catch (e) {
        console.error("Rooms init error", e);
      }
    };
    init();

    const fetchRooms = async () => {
      try {
        const { data } = await supabase
          .from("rooms")
          .select("*, profiles(username)")
          .order("created_at", { ascending: false });
        if (data) setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();

    // Subscribe to realtime room updates (created or deleted)
    const channel = supabase
      .channel("public:rooms_list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rooms" }, (payload) => {
        // Fetch the corresponding profile for the username display
        supabase.from("profiles").select("username").eq("id", payload.new.created_by).single().then(({ data }) => {
          setRooms((prev) => {
            if (prev.find(r => r.id === payload.new.id)) return prev;
            return [{ ...payload.new, profiles: data }, ...prev];
          });
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms" }, (payload) => {
        setRooms((prev) => prev.filter(r => r.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;
    
    const { data, error } = await supabase
      .from("rooms")
      .insert({ 
        name: newRoomName.trim(), 
        created_by: user.id,
        topic: newRoomTopic.trim() || null,
        description: newRoomDesc.trim() || null,
        duration_minutes: newRoomDuration,
        is_private: isPrivate,
      })
      .select("*, profiles(username)")
      .single();

    if (data && !error) {
      setRooms([data, ...rooms]);
      setShowCreate(false);
      setNewRoomName(""); setNewRoomTopic(""); setNewRoomDesc("");
      setNewRoomDuration(25); setIsPrivate(false);
      setDailyRoomsCreated(prev => prev + 1);
      router.push(`/rooms/${data.id}`);
    } else if (error) {
      alert("Failed to create room: " + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Study Rooms</h1>
          <p className="text-gray-400">Join a room and collaborate with others</p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            {!isPremium && (
               <div className="text-right flex flex-col items-end">
                  <p className="text-xs text-gray-400 font-medium">Rooms Created: <span className={dailyRoomsCreated >= 2 ? "text-red-400" : "text-white"}>{dailyRoomsCreated} / 2 today</span></p>
                  {dailyRoomsCreated >= 2 && <button onClick={() => router.push('/upgrade')} className="text-[10px] text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-wider mt-1 transition-transform hover:scale-105 active:scale-95">Upgrade for unlimited 🚀</button>}
               </div>
            )}
            <button 
              onClick={() => {
                if (!isPremium && dailyRoomsCreated >= 2) {
                  alert("You've reached your free limit of 2 rooms per day. Upgrade to continue without limits 🚀");
                  router.push("/upgrade");
                  return;
                }
                setShowCreate(!showCreate);
              }}
              className={`flex items-center gap-2 px-4 py-2 ${isPremium ? "bg-blue-600 hover:bg-blue-700" : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:scale-105"} text-white rounded-lg transition-all text-sm font-medium shadow-lg`}
            >
              {isPremium ? <Plus size={16} /> : <div className="font-bold text-[10px] tracking-wider uppercase text-black bg-white/40 px-1 rounded">Pro</div>} 
              {showCreate ? "Cancel" : "Create Room"}
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <form onSubmit={createRoom} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col gap-5 shadow-xl animate-in slide-in-from-top-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Room Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Calculus Study Group"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Topic <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Integration by Parts"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newRoomTopic}
                onChange={(e) => setNewRoomTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                placeholder="Brief description of the session"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
              />
            </div>
          </div>
          
          {/* Session Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Session Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {DURATIONS.map(d => {
                const locked = d.premium && !isPremium;
                return (
                  <button
                    key={d.mins}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setNewRoomDuration(d.mins)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      newRoomDuration === d.mins
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : locked
                        ? "border-gray-800 text-gray-600 cursor-not-allowed"
                        : "border-gray-700 hover:border-gray-600 text-gray-300"
                    }`}
                  >
                    <span className="text-lg font-black">{d.label}</span>
                    <span className="text-[10px] uppercase tracking-wide">{d.desc}</span>
                    {locked && <span className="text-[9px] text-yellow-500 font-bold">PRO 🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
               <input type="checkbox" className="form-checkbox w-5 h-5 bg-gray-800 border-gray-700 text-blue-500 rounded focus:ring-0 transition-colors" 
                 onChange={(e) => {
                    if (!isPremium) { e.preventDefault(); router.push("/upgrade"); }
                    else { setIsPrivate(e.target.checked); }
                 }}
                 checked={isPrivate}
               />
               <span className={`text-sm font-medium flex items-center gap-2 ${isPremium ? "text-gray-300" : "text-gray-500 group-hover:text-yellow-500 transition-colors"}`}>
                 Private Room 
                 {!isPremium && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider font-extrabold">PRO</span>}
               </span>
            </label>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 active:scale-95">
              🚀 Launch Room
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
          <p className="text-gray-400">No rooms available.</p>
        </div>
      )}
    </div>
  );
}

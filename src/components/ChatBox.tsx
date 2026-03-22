"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Send, Users, LogOut, Timer, Bot, X, RotateCcw, Play, Pause, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCall from "./VideoCall";

// ─────────────────────── Focus Timer ───────────────────────
const TIMER_MODES = [
  { label: "25 min", secs: 25 * 60 },
  { label: "50 min", secs: 50 * 60 },
  { label: "90 min", secs: 90 * 60 },
];

function FocerTimer({ roomId, isPremium }: { roomId: string; isPremium?: boolean }) {
  const [modeIdx, setModeIdx] = useState(0);
  const totalSecs = TIMER_MODES[modeIdx].secs;
  const [secs, setSecs] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  const broadcast = (state: any) => {
    supabase.channel(`timer_${roomId}`).send({ type: "broadcast", event: "timer", payload: state });
  };

  useEffect(() => {
    const ch = supabase.channel(`timer_${roomId}`)
      .on("broadcast", { event: "timer" }, ({ payload }: any) => {
        setSecs(payload.secs); setRunning(payload.running);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          if (next === 0) { clearInterval(intervalRef.current); setRunning(false); }
          return next;
        });
      }, 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(secs / 60)).padStart(2, "0");
  const secsStr = String(secs % 60).padStart(2, "0");
  const pct = ((totalSecs - secs) / totalSecs) * 100;

  const toggle = () => { const r = !running; setRunning(r); broadcast({ secs, running: r }); };
  const reset = () => { setSecs(totalSecs); setRunning(false); broadcast({ secs: totalSecs, running: false }); };
  const changeMode = (idx: number) => {
    if (!isPremium && idx !== 0) return;
    setModeIdx(idx); setSecs(TIMER_MODES[idx].secs); setRunning(false);
    broadcast({ secs: TIMER_MODES[idx].secs, running: false });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Focus Timer — visible to all</p>
      {/* Mode selector — premium only for 50/90 min */}
      <div className="flex gap-1 bg-gray-800 rounded-full p-1">
        {TIMER_MODES.map((m, i) => (
          <button key={i} onClick={() => changeMode(i)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              modeIdx === i ? "bg-blue-600 text-white" :
              (!isPremium && i !== 0) ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white"
            }`}>
            {m.label}{!isPremium && i !== 0 && " 🔒"}
          </button>
        ))}
      </div>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke={secs === 0 ? "#22c55e" : running ? "#3b82f6" : "#6366f1"}
            strokeWidth="2.5" strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset="0" strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-white">{mins}:{secsStr}</span>
          <span className="text-[10px] text-gray-500 mt-1">{secs === 0 ? "Done! 🎉" : running ? "Focusing..." : "Paused"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggle} className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all ${running ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25"}`}>
          {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
        </button>
        <button onClick={reset} className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────── In-Room AI Panel ───────────────────────
function RoomAIPanel({ roomTopic, userId }: { roomTopic?: string; userId: string }) {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const defaultPrompt = roomTopic ? `Help me with: ${roomTopic}` : "";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setMsgs((p) => [...p, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, userId }),
      });
      const d = await res.json();
      setMsgs((p) => [...p, { role: "assistant", content: d.error ? `❌ ${d.error}` : d.response }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Failed to reach AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-3 border-b border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">AI Study Assistant</p>
        {roomTopic && <p className="text-xs text-blue-400 mt-1">Topic: {roomTopic}</p>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-6">
            <Bot size={32} className="mx-auto mb-3 text-purple-500/50" />
            Ask me anything about your study topic!
            {roomTopic && (
              <button onClick={() => setInput(defaultPrompt)} className="block mx-auto mt-3 text-xs text-purple-400 hover:text-purple-300 underline transition-colors">
                Ask about &quot;{roomTopic}&quot;
              </button>
            )}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          placeholder="Ask a study question..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-2 rounded-full transition-all">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// ─────────────────────── Main ChatBox ───────────────────────
type Panel = "chat" | "timer" | "ai" | "video" | null;

export default function ChatBox({ roomId, user, roomTopic, isPremium, maxMembers, isHost, username }: { roomId: string; user: any; roomTopic?: string; isPremium?: boolean; maxMembers?: number; isHost?: boolean; username?: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("🟡 Connecting...");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const limit = maxMembers ?? 10;
  const userId = user?.id;

  // 1. Fetch initial data (runs once per roomId)
  useEffect(() => {
    const fetchData = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*, profiles(username, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs);

      const { data: members } = await supabase
        .from("room_members")
        .select("user_id, profiles(username, avatar_url)")
        .eq("room_id", roomId);
      if (members) setActiveUsers(members);
      
      const { data: roomData } = await supabase
        .from("rooms").select("video_active").eq("id", roomId).single();
      if (roomData) setVideoActive(!!roomData.video_active);
    };
    fetchData();
  }, [roomId]);

  // 2. Realtime Subscriptions (runs once per roomId)
  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const fetchProfile = async () => {
          const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", payload.new.user_id).single();
          setMessages((prev) => {
            // Check if already optimistically added
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, profiles: data }];
          });
        };
        fetchProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, async () => {
        const { data: members } = await supabase
          .from("room_members")
          .select("user_id, profiles(username, avatar_url)")
          .eq("room_id", roomId);
        if (members) setActiveUsers(members);
      })
      // Listen for video_active changes on the room
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        setVideoActive(!!payload.new?.video_active);
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("🟢 Live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus(`🔴 Failed: ${status}`);
          console.error("Realtime Error:", err);
        } else {
          setRealtimeStatus(`🟡 ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 3. Room Membership Management (runs when user logs in/out)
  useEffect(() => {
    if (!userId) return;

    // Check capacity and join
    supabase.from("room_members").select("user_id", { count: 'exact', head: true }).eq("room_id", roomId)
      .then(({ count }) => {
        if ((count ?? 0) < limit) {
          supabase.from("room_members").upsert({ room_id: roomId, user_id: userId }).then();
        }
      });

    const handleBeforeUnload = () => {
      supabase.from("room_members").delete().match({ room_id: roomId, user_id: userId }).then();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomId, userId, limit]);

  useEffect(() => {
    if (panel === "chat" || panel === null) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, panel]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear immediately for UX
    
    // OPTIMISTIC UPDATE: show immediately for the sender
    const tempId = crypto.randomUUID();
    const optimisticMsg = {
      id: tempId,
      room_id: roomId,
      user_id: user.id,
      message: messageToSend,
      created_at: new Date().toISOString(),
      profiles: {
        username: username || "You",
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
      }
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    const { data, error } = await supabase.from("messages").insert({ 
      room_id: roomId, 
      user_id: user.id, 
      message: messageToSend 
    }).select().single();
    
    if (error) {
      console.error("Message send failed:", error);
      alert("Failed to send message: " + error.message);
      // Revert optimistic update and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageToSend);
    } else if (data) {
      // Replace optimistic ID with real DB ID
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
    }
  };

  const leaveRoom = async () => {
    if (user) await supabase.from("room_members").delete().match({ room_id: roomId, user_id: user.id });
    router.push("/rooms");
  };

  const togglePanel = (p: Panel) => setPanel(prev => prev === p ? null : p);

  return (
    <div className="flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mt-6 shadow-xl shadow-black/50">
      {/* Video Call Active Banner — visible to all members */}
      {videoActive && panel !== "video" && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border-b border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-blue-300">📹 Video Call Active</span>
            <span className="text-[10px] text-blue-400/60">Someone started a call in this room</span>
          </div>
          <button
            onClick={() => setPanel("video")}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-full transition-colors"
          >
            Join Call →
          </button>
        </div>
      )}
      {/* Header with Tools */}
      <div className="bg-gray-950 px-5 py-3 border-b border-gray-800 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => { setShowUsers(!showUsers); if (panel !== "chat" && panel !== null) setPanel(null); }} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <Users size={18} />
            <span className="text-sm font-medium">{activeUsers.length} Online</span>
          </button>
          
          <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800" title="Realtime Sync Status">
            {realtimeStatus}
          </div>
          
          <div className="h-4 w-px bg-gray-800 mx-1" />
          
          {/* Action Tabs moved to Header for cleaner UI */}
          <div className="flex items-center gap-4">
            <button onClick={() => togglePanel("timer")} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${panel === "timer" ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"}`}>
              <Timer size={14} /> Timer
            </button>
            <button onClick={() => togglePanel("ai")} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${panel === "ai" ? "text-purple-400" : "text-gray-500 hover:text-purple-400"}`}>
              <Bot size={14} /> Ask AI
            </button>
            <button onClick={() => togglePanel("video")} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${panel === "video" ? "text-blue-400" : "text-gray-500 hover:text-blue-400"}`}>
              <Video size={14} /> Video
            </button>
          </div>
        </div>
        
        <button onClick={leaveRoom} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all text-sm font-medium">
          <LogOut size={16} /> Leave
        </button>
      </div>

      {/* Main Area */}
      <div className="flex min-h-[500px] max-h-[70vh]">
        {/* Users sidebar */}
        <AnimatePresence>
          {showUsers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-950 border-r border-gray-800 overflow-hidden flex-shrink-0"
            >
              <div className="p-4 overflow-y-auto h-full">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">In this room</h3>
                <div className="space-y-3">
                  {activeUsers.map(member => (
                    <div key={member.user_id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                      <img src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} className="w-6 h-6 rounded-full bg-gray-800 flex-shrink-0" alt="avatar" />
                      <span className="text-sm text-gray-200 truncate">{member.profiles?.username || "Unknown"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {panel === "timer" && (
              <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-gray-900 z-20 overflow-y-auto">
                <div className="flex justify-end p-3"><button onClick={() => setPanel(null)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button></div>
                <FocerTimer roomId={roomId} isPremium={isPremium} />
              </motion.div>
            )}
            {panel === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-gray-900 z-20 flex flex-col">
                <div className="flex justify-end p-3 flex-shrink-0"><button onClick={() => setPanel(null)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button></div>
                <div className="flex-1 overflow-hidden">
                  <RoomAIPanel roomTopic={roomTopic} userId={user?.id} />
                </div>
              </motion.div>
            )}
            {panel === "video" && (
              <motion.div key="video" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-gray-900 z-20 overflow-y-auto">
                <div className="flex justify-end p-3"><button onClick={() => setPanel(null)} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button></div>
                <VideoCall roomId={roomId} isPremium={isPremium} username={username} isHost={isHost} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  key={msg.id}
                  className={`flex ${msg.user_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.user_id === user?.id ? "bg-blue-600 text-white rounded-br-sm shadow-blue-500/20" : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm"}`}>
                    {msg.user_id !== user?.id && <p className="text-xs text-gray-400 font-medium mb-1">{msg.profiles?.username || "Unknown"}</p>}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2 items-center flex-shrink-0 z-10 w-full">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-950 border border-gray-800 text-white text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
            />
            <button type="submit" disabled={!newMessage.trim()} className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white w-11 h-11 rounded-full transition-all shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

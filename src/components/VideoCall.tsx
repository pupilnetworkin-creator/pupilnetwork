"use client";

import { useState, useRef, useEffect } from "react";
import { Video, X, Maximize2, Minimize2, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface VideoCallProps {
  roomId: string;
  isPremium?: boolean;
  username?: string;
  isHost?: boolean;
}

export default function VideoCall({ roomId, isPremium, username, isHost }: VideoCallProps) {
  const [callActive, setCallActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);

  // Derive stable room name
  const jitsiRoom = `PupilNetwork-${roomId.replace(/-/g, "").slice(0, 20)}`;
  
  // Clean URL to bypass unnecessary login pages
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}#userInfo.displayName="${username || 'User'}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;

  const startCall = async () => {
    setStarting(true);
    await supabase.from("rooms").update({ video_active: true }).eq("id", roomId);
    setStarting(false);
    
    // Open in new tab immediately
    window.open(jitsiUrl, "_blank");
    
    // Switch to an "in progress" state for this specific user
    setCallActive(true);
  };

  const joinCall = () => {
    window.open(jitsiUrl, "_blank");
    setCallActive(true);
  };

  const endCall = async () => {
    setCallActive(false);
    if (isHost) {
      await supabase.from("rooms").update({ video_active: false }).eq("id", roomId);
    }
  };

  if (!callActive) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <Video size={28} className="text-blue-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Live Video Call</p>
          <p className="text-[11px] text-gray-600 leading-relaxed px-4">
            Start a call — opening in a new tab. All room members will be notified to join.
          </p>
        </div>
        <button
          onClick={startCall}
          disabled={starting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-full font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
        >
          {starting ? <><Loader2 size={15} className="animate-spin" /> Starting...</> : <><ExternalLink size={16} /> Start in New Tab</>}
        </button>
      </div>
    );
  }

  // Active state: The call is happening in another tab
  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-500/20 relative">
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
        <Video size={28} className="text-green-400" />
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs text-white uppercase tracking-widest font-bold">Call in Progress</p>
        <p className="text-[11px] text-gray-400 leading-relaxed px-4">
          Your video call is running in another tab.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={joinCall}
          className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-full font-semibold text-xs transition-all"
        >
          <ExternalLink size={14} /> Rejoin
        </button>
        
        {isHost && (
          <button
            onClick={endCall}
            className="flex items-center gap-2 px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-full font-semibold text-xs transition-all"
          >
            <X size={14} /> End Call for All
          </button>
        )}
      </div>
    </div>
  );
}

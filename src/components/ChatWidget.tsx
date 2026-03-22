"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 5 });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("is_premium").eq("id", session.user.id).single();
        if (data?.is_premium) setIsPremium(true);
      }
    };
    
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("is_premium").eq("id", session.user.id).single();
        setIsPremium(!!data?.is_premium);
      } else {
        setIsPremium(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || "An error occurred." }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        if (data.usage) setUsage(data.usage);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Failed to connect to AI." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-[350px] sm:w-[400px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 font-bold">
              <Bot size={20} /> AI Study Buddy
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-950/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                Ask me a question! I'm here to help you study.
                <br/>
                {isPremium ? (
                  <span className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-black mt-3 block tracking-[0.2em] uppercase drop-shadow-md">✦ Premium AI Active ✦</span>
                ) : (
                  <span className="text-xs text-blue-400 mt-2 block">Premium unlocks unlimited history!</span>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-bl-sm text-sm flex gap-1 items-center border border-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-800 bg-gray-900">
            <form onSubmit={sendMessage} className="relative">
              <input
                type="text"
                placeholder="Ask something..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-1 top-1 bottom-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-full transition-colors flex items-center justify-center aspect-square"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
            {!isPremium && (
              <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col items-center">
                 <p className="text-xs font-semibold text-gray-400 mb-1">
                   AI Usage: <span className={usage.used >= usage.limit ? "text-red-400" : "text-white"}>{usage.used} / {usage.limit} today</span>
                 </p>
                 {usage.used >= usage.limit && (
                   <div className="w-full bg-red-900/30 border border-red-500/50 text-red-300 text-xs p-2 rounded-lg text-center mt-2 mb-2">
                     You've reached your limit.
                   </div>
                 )}
                 <button onClick={(e) => { e.preventDefault(); router.push('/upgrade'); }} className="text-[10px] text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest mt-1 transition-colors hover:scale-105 active:scale-95">
                   Upgrade to continue without limits 🚀
                 </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          id="ai-widget-trigger"
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-4 rounded-full shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}

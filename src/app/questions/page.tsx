"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { Search, Plus, MessageSquare, Loader2, Tag, ChevronUp } from "lucide-react";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch questions from DB
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("questions")
          .select("*, profiles(username), answers(count)")
          .order("created_at", { ascending: false });

        if (searchQuery.trim()) {
          query = query.ilike("title", `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;
        
        if (data) {
          // Flatten answer count
          const mapped = data.map(q => ({
            ...q,
            answerCount: q.answers[0]?.count || 0
          }));
          setQuestions(mapped);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            Community Q&A
          </h1>
          <p className="text-gray-400 mt-2">Get unstuck fast. Ask doubts and help classmates.</p>
        </div>
        <Link 
          href="/questions/ask" 
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20"
        >
          <Plus size={18} strokeWidth={3} /> Ask Question
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-500 group-focus-within:text-green-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search by topic or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600 shadow-sm"
        />
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex py-12 justify-center text-green-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
            <MessageSquare size={48} className="mx-auto text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-300">No questions found</h3>
            <p className="text-gray-500 text-sm mt-1">Be the first to ask something!</p>
          </div>
        ) : (
          questions.map((q) => (
            <Link 
              key={q.id} 
              href={`/questions/${q.id}`} 
              className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-green-500/50 hover:bg-gray-800/80 transition-all hover:shadow-[0_4px_20px_-10px_rgba(34,197,94,0.2)]"
            >
              <div className="flex items-start gap-4">
                {/* Points box (Mockup styling for MVP) */}
                <div className="hidden sm:flex flex-col items-center justify-center bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 min-w-[64px]">
                  <ChevronUp size={20} className="text-gray-500 mb-1" />
                  <span className="font-bold text-gray-300 text-sm">{q.points || 0}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white mb-2 truncate">{q.title}</h2>
                  
                  {/* Tags */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {q.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${q.user_id}`} alt="avatar" />
                      </div>
                      {q.profiles?.username || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-950 px-2 py-1 rounded-md border border-gray-800">
                      <MessageSquare size={12} className={q.answerCount > 0 ? "text-green-500" : "text-gray-600"} />
                      <span className={q.answerCount > 0 ? "text-gray-300" : "text-gray-500"}>{q.answerCount} Answers</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

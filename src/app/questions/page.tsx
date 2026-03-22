"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { Search, Plus, MessageSquare, Loader2, Tag, ChevronUp } from "lucide-react";

// Define a type for the profile data
interface Profile {
  username: string;
}

// Define a type for the question data
interface Question {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  points: number;
  tags: string[];
  profiles: Profile | null;
  answerCount: number;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch questions from DB
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*, profiles:user_id(username), answers(count)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((q: any) => ({
            ...q,
            answerCount: q.answers?.[0]?.count || 0,
            profiles: q.profiles || null
          }));
          setQuestions(mapped);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Filter questions based on search
  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 mt-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Questions Board
            </h1>
            <p className="text-gray-400 font-medium">Get answers from the community or AI.</p>
          </div>
          <Link 
            href="/questions/ask" 
            className="group bg-white text-black px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-green-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Ask Question
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-12">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors" size={22} />
          <input
            type="text"
            placeholder="Search for a doubt, topic, or subject..."
            className="w-full bg-gray-900/50 border border-gray-800 text-white rounded-[24px] pl-14 pr-6 py-5 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all text-lg font-medium backdrop-blur-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-green-500" size={48} />
            <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Board...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-32 bg-gray-900/20 rounded-[32px] border border-dashed border-gray-800">
            <p className="text-gray-500 font-bold mb-2">No questions found matching your search.</p>
            <button onClick={() => setSearchQuery("")} className="text-green-500 font-black hover:underline underline-offset-4">Clear Filters</button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map((q) => (
              <Link 
                key={q.id} 
                href={`/questions/${q.id}`}
                className="group block bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800 hover:border-green-500/30 rounded-[28px] p-6 transition-all hover:-translate-y-1 active:scale-[0.99] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronUp className="text-green-500" size={24} />
                </div>
                
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-snug">
                    {q.title}
                  </h2>
                  
                  {/* Tags */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.tags.map((tag, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-lg">
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer Metadata */}
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${q.user_id}`} 
                          alt="avatar" 
                          width={32}
                          height={32}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-300">{q.profiles?.username || "Anonymous"}</span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800 group-hover:border-green-500/20 transition-colors">
                        <MessageSquare size={14} className={q.answerCount > 0 ? "text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "text-gray-600"} />
                        <span className={`text-xs font-bold ${q.answerCount > 0 ? "text-white" : "text-gray-600"}`}>
                          {q.answerCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

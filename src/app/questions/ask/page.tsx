"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Sparkles, Send, Tag } from "lucide-react";

export default function AskQuestionPage() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyQuestions, setDailyQuestions] = useState(0);
  const [checkLoading, setCheckLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      // Check premium status
      const { data: profile } = await supabase.from("profiles").select("is_premium").eq("id", session.user.id).single();
      if (profile?.is_premium) setIsPremium(true);

      // Check daily questions
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("questions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .gte("created_at", startOfDay.toISOString());
      
      setDailyQuestions(count || 0);
      setCheckLoading(false);
    };
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;
    
    setLoading(true);
    
    // Parse tags safely
    const parsedTags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 5); // Limit to 5 tags

    const { data, error } = await supabase
      .from("questions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags,
        points: 0 // New questions start with 0 points based on spec mockup
      })
      .select()
      .single();

    if (error) {
      console.error("Error posting question:", JSON.stringify(error, null, 2));
      alert("Failed to post question: " + (error.message || JSON.stringify(error)));
      setLoading(false);
    } else {
      // Award +5 Points for asking a question
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ points: profile.points + 5 }).eq("id", user.id);
      }
      
      router.push(`/questions/${data.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/questions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Community
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Sparkles className="text-green-500" size={28} />
          Drop a Question
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 mb-4">
          <p className="text-gray-400 text-lg">Stuck on a problem? The PupilNetwork community has your back.</p>
          
          {!checkLoading && !isPremium && (
             <div className="inline-flex self-start sm:self-auto items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full shadow-inner">
               <div className={`w-2 h-2 rounded-full ${dailyQuestions >= 3 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`}></div>
               <span className="text-xs font-bold tracking-wide text-gray-300">
                 {dailyQuestions}/3 Free Questions Today
               </span>
             </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 border border-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-bold tracking-wide text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Explain recursion in Python like I'm 5"
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-bold tracking-wide text-gray-300">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide all the details, code snippets, or context needed to answer your doubt..."
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm resize-y"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-bold tracking-wide text-gray-300 flex items-center gap-2">
            <Tag size={14} className="text-green-500" /> Tags <span className="text-gray-600 font-normal text-xs ml-1">(Optional, max 5)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Math, Coding, Physics (comma separated)"
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
          />
          {tagsInput.trim() && (
            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-950 rounded-xl border border-gray-800/50">
              {tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0).slice(0,5).map((tag, idx) => (
                <span key={idx} className="text-xs uppercase font-bold tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Free Tier Limit Check */}
        {!isPremium && dailyQuestions >= 3 ? (
          <div className="pt-6 border-t border-gray-800 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/30">
            <Sparkles className="text-yellow-500 mb-2" size={28} />
            <h3 className="text-lg font-bold text-yellow-500 mb-1">Daily Limit Reached</h3>
            <p className="text-gray-300 text-sm text-center mb-4">You've hit the 3 questions/day limit for free users. Upgrade to Premium for unhindered learning.</p>
            <Link href="/upgrade" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-extrabold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all hover:scale-105">
              Go Premium (Unlimited)
            </Link>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-1"
            >
              {loading ? "Dropping..." : "Drop Question"} <Send size={18} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

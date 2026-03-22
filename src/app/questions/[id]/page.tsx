"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Send, ThumbsUp, Tag, Brain, Loader2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestionDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const fetchQuestionAndAnswers = async () => {
      // Fetch Question
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("*, profiles(username)")
        .eq("id", id)
        .single();
      
      if (qErr) {
        console.error("Error fetching question:", qErr);
        router.push("/questions");
        return;
      }
      setQuestion(qData);

      // Fetch Answers
      const { data: aData } = await supabase
        .from("answers")
        .select("*, profiles(username)")
        .eq("question_id", id)
        .order("is_best", { ascending: false }) // Best answers first
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: true });
        
      if (aData) setAnswers(aData);
      setLoading(false);
    };

    if (id) fetchQuestionAndAnswers();
  }, [id, router]);

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim() || !user) return;
    
    setSubmitting(true);
    const content = newAnswer.trim();
    setNewAnswer(""); // Optimistic clear
    
    // Optimistic UI update
    const tempId = crypto.randomUUID();
    const optimisticAnswer = {
      id: tempId,
      question_id: id,
      user_id: user.id,
      content,
      upvotes: 0,
      is_best: false,
      created_at: new Date().toISOString(),
      profiles: { username: user.email?.split("@")[0] || "You" }
    };
    setAnswers(prev => [...prev, optimisticAnswer]);

    const { data, error } = await supabase
      .from("answers")
      .insert({ question_id: id, user_id: user.id, content })
      .select("*, profiles(username)")
      .single();

    if (error) {
      alert("Failed to submit answer: " + error.message);
      setAnswers(prev => prev.filter(a => a.id !== tempId));
      setNewAnswer(content);
    } else if (data) {
      setAnswers(prev => prev.map(a => a.id === tempId ? data : a));
      
      // Award +10 points for answering a question
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ points: profile.points + 10 }).eq("id", user.id);
      }
    }
    setSubmitting(false);
  };

  const askAi = async () => {
    if (!question || aiLoading) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const prompt = `Please explain and help me solve this doubt: ${question.title}. Context: ${question.content}`;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userId: user?.id || "anonymous" })
      });
      const data = await res.json();
      if (data.error) setAiResponse(`AI Error: ${data.error}`);
      else setAiResponse(data.response);
    } catch (e) {
      setAiResponse("Failed to connect to AI study buddy.");
    } finally {
      setAiLoading(false);
    }
  };

  const upvoteAnswer = async (answerId: string, currentVotes: number) => {
    if (!user) return alert("Please log in to upvote");
    
    // Optimistic
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a));
    
    const { error } = await supabase
      .from("answers")
      .update({ upvotes: currentVotes + 1 })
      .eq("id", answerId);
      
    if (error) {
      // Revert on error
      setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, upvotes: currentVotes } : a));
    }
  };

  const markBestAnswer = async (answerId: string) => {
    if (!user || user.id !== question.user_id) return;
    
    // Optimistic
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, is_best: true } : { ...a, is_best: false }));
    
    await supabase.from("answers").update({ is_best: false }).eq("question_id", id);
    await supabase.from("answers").update({ is_best: true }).eq("id", answerId);
    
    // Award +25 points logic for the person whose answer got chosen
    const bestAns = answers.find(a => a.id === answerId);
    if (bestAns) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", bestAns.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({ points: profile.points + 25 }).eq("id", bestAns.user_id);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-green-500"><Loader2 className="animate-spin" size={40} /></div>;
  }

  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <Link href="/questions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Community Board
      </Link>

      {/* Question Block */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex gap-4">
          {/* Points (Vote mockup) */}
          <div className="flex flex-col items-center justify-start pt-2">
            <button className="text-gray-500 hover:text-green-400 transition-colors p-1"><ThumbsUp size={24} /></button>
            <span className="font-bold text-xl text-gray-200 my-1">{question.points || 0}</span>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">{question.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 font-mono text-sm leading-relaxed mb-6 bg-black/40 p-5 rounded-2xl border border-gray-800/50 block whitespace-pre-wrap">
              {question.content}
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {question.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="flex items-center gap-1 text-[11px] uppercase font-bold tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-2">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${question.user_id}`} alt="avatar" className="w-8 h-8 rounded-full bg-gray-800" />
                <span>Asked by <strong className="text-gray-200">{question.profiles?.username || "Unknown"}</strong></span>
                <span className="text-gray-600">•</span>
                <span>{new Date(question.created_at).toLocaleDateString()}</span>
              </div>
              
              {/* Ask AI Button */}
              <button 
                onClick={askAi}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                Ask AI to Explain
              </button>
            </div>

            {/* AI Explanation Box */}
            <AnimatePresence>
              {(aiLoading || aiResponse) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-indigo-950/40 border border-indigo-500/30 p-5 rounded-2xl relative">
                    <div className="absolute -top-3 -left-3 w-24 h-24 bg-indigo-500/20 blur-[30px] rounded-full pointer-events-none"></div>
                    <h3 className="flex items-center gap-2 font-bold text-indigo-300 mb-3"><Brain size={18} /> AI Study Breakdown</h3>
                    {aiLoading ? (
                      <div className="flex items-center gap-3 text-indigo-400/70 text-sm font-mono">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </span>
                        Analyzing doubt and generating explanation...
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-indigo-100 font-mono whitespace-pre-wrap leading-relaxed relative z-10">
                        {aiResponse}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="text-green-500" size={20} />
        {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
      </h2>

      <div className="space-y-4 mb-12">
        {answers.map((ans) => (
          <div key={ans.id} className={`bg-gray-900 border ${ans.is_best ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-800'} rounded-2xl p-5 md:p-6 transition-all`}>
            <div className="flex gap-4">
              {/* Upvote */}
              <div className="flex flex-col items-center pt-1">
                <button onClick={() => upvoteAnswer(ans.id, ans.upvotes)} className="text-gray-500 hover:text-green-400 transition-colors bg-gray-950 p-2 rounded-lg border border-gray-800 hover:border-green-500/30">
                  <ThumbsUp size={16} />
                </button>
                <span className="font-bold text-sm text-gray-300 mt-2">{ans.upvotes || 0}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.user_id}`} alt="avatar" className="w-6 h-6 rounded-full bg-gray-800" />
                    <span className="font-bold text-gray-200 text-sm">{ans.profiles?.username || "Unknown"}</span>
                    <span className="text-xs text-gray-600">• {new Date(ans.created_at).toLocaleDateString()}</span>
                  </div>
                  {ans.is_best && (
                     <span className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                       <Award size={14} /> Best Answer
                     </span>
                  )}
                  {/* Host can mark best answer */}
                  {user && user.id === question.user_id && !ans.is_best && (
                    <button onClick={() => markBestAnswer(ans.id)} className="text-xs text-gray-500 hover:text-yellow-500 transition-colors font-medium">
                      Mark as Best
                    </button>
                  )}
                </div>
                <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {ans.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {answers.length === 0 && (
          <div className="text-center py-12 bg-gray-900/50 border border-gray-800 border-dashed rounded-2xl">
            <p className="text-gray-500 mb-1">No answers yet.</p>
            <p className="text-sm font-bold text-green-400">Be the first to help out!</p>
          </div>
        )}
      </div>

      {/* Sticky Add Answer Bar */}
      {user ? (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/80 backdrop-blur-xl border-t border-gray-800 p-4 z-40">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={submitAnswer} className="flex items-end gap-3 relative">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Write your answer..."
                rows={newAnswer.split('\n').length > 1 ? Math.min(newAnswer.split('\n').length, 5) : 1}
                className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm resize-none overflow-y-auto min-h-[48px]"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-2xl p-3 border border-green-500/50 transition-all flex-shrink-0 h-[48px] w-[48px] flex items-center justify-center shadow-lg shadow-green-500/20"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4 z-40 text-center">
          <p className="text-gray-400 text-sm">Please <Link href="/login" className="text-green-500 hover:underline">log in</Link> to answer this question.</p>
        </div>
      )}
    </div>
  );
}

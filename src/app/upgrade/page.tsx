"use client";
// TS Cache Purge
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { CheckCircle2, Sparkles, ShieldCheck, Check, Zap, Lock, BarChart, Trophy, Bot, Flame } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyPremium, setAlreadyPremium] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        supabase.from("profiles").select("is_premium").eq("id", currentUser.id).single()
          .then(({ data }: { data: any }) => {
            if (data?.is_premium) setAlreadyPremium(true);
          });
      }
    });
  }, []);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update profile in DB
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", user.id);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setAlreadyPremium(true);
    }
  };

  if (alreadyPremium) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] px-4 space-y-6 text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,165,0,0.5)] mb-4"
        >
          <Sparkles className="text-white" size={48} />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-white">You are a Premium Member!</h1>
        <p className="text-xl text-gray-400 max-w-lg">
          Thank you for supporting PupilNetwork. Your account is fully upgraded with unlimited access.
        </p>
        <Link href="/dashboard" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-bold transition-all shadow-lg mt-8 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* 1. Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 drop-shadow-sm">
          Study Smarter. Learn Faster. Rank Higher.
        </h1>
        <p className="text-xl md:text-2xl text-yellow-500 font-medium">
          Upgrade to PupilNetwork Premium and turn your study sessions into results.
        </p>
      </motion.div>

      {/* 2. Premium Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[20px] p-8 md:p-12 relative overflow-hidden flex flex-col items-center"
        style={{ boxShadow: "0 0 40px rgba(255, 165, 0, 0.2)" }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="w-full flex flex-col md:flex-row gap-12 justify-between w-full">
          
          {/* Features Column */}
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">Premium Features</h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><Bot className="text-blue-400 shrink-0" size={24} /><span className="text-gray-200 text-lg font-medium"><strong>Unlimited AI Tutor</strong> – Solve doubts instantly</span></li>
                <li className="flex items-center gap-3"><Zap className="text-yellow-400 shrink-0" size={24} /><span className="text-gray-200 text-lg font-medium"><strong>Priority room access</strong> – Join top study sessions faster</span></li>
                <li className="flex items-center gap-3"><Lock className="text-green-400 shrink-0" size={24} /><span className="text-gray-200 text-lg font-medium"><strong>Private study rooms</strong> – Focus without distractions</span></li>
                <li className="flex items-center gap-3"><BarChart className="text-purple-400 shrink-0" size={24} /><span className="text-gray-200 text-lg font-medium"><strong>Advanced analytics</strong> – Track your progress</span></li>
                <li className="flex items-center gap-3"><Trophy className="text-orange-400 shrink-0" size={24} /><span className="text-gray-200 text-lg font-medium"><strong>Premium badge</strong> – Stand out on leaderboard</span></li>
              </ul>
            </div>

            {/* Why Upgrade Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-500" size={24} />
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Why Students Upgrade</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-gray-400"><Check className="text-green-500 mt-0.5 shrink-0" size={18} /> Save hours every day</li>
                <li className="flex items-start gap-2 text-gray-400"><Check className="text-green-500 mt-0.5 shrink-0" size={18} /> Get instant answers anytime</li>
                <li className="flex items-start gap-2 text-gray-400"><Check className="text-green-500 mt-0.5 shrink-0" size={18} /> Stay consistent with study</li>
                <li className="flex items-start gap-2 text-gray-400"><Check className="text-green-500 mt-0.5 shrink-0" size={18} /> Improve faster than others</li>
              </ul>
            </div>
          </div>

          {/* Pricing & CTA Column */}
          <div className="w-full md:w-80 flex flex-col items-center justify-center space-y-6 pt-6 md:pt-0 md:border-l md:border-gray-800 md:pl-12">
            
            <div className="text-center relative">
              {/* Subtle pricing glow */}
              <div className="absolute inset-0 bg-yellow-500/20 blur-[40px] rounded-full pointer-events-none"></div>
              <h3 className="text-[32px] font-extrabold text-white mb-1 shadow-sm relative z-10">₹99<span className="text-lg text-gray-400 font-normal">/mo</span></h3>
              <p className="text-sm text-gray-400 font-medium relative z-10">Cancel anytime securely.</p>
            </div>

            <div className="w-full relative z-10">
              {!user ? (
                <Link href="/login" className="block w-full px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-bold transition-all text-center">
                  Log In to Upgrade
                </Link>
              ) : success ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3 text-green-500 font-bold bg-green-500/10 py-4 rounded-2xl border border-green-500/20">
                  <ShieldCheck size={32} />
                  Payment Successful!
                </motion.div>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white rounded-2xl font-extrabold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 0 20px rgba(255, 165, 0, 0.6)" }}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>Upgrade Now <Sparkles size={20} /></>
                  )}
                </motion.button>
              )}
            </div>

            {/* FOMO Section */}
            <p className="text-sm font-bold text-yellow-500 flex items-center gap-1.5 animate-pulse mt-4 text-center">
              🔥 Join 500+ students already upgrading
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

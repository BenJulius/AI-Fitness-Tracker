"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Lock, Sparkles, Zap } from "lucide-react";
import AnimatedPanda from "@/components/AnimatedPanda"; // Keep your existing component

export default function Insights() {
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
        setTier(data?.tier || "free");
      }
      setLoading(false);
    };
    fetchTier();
  }, []);

  const upgradeToPremium = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ tier: "premium" }).eq("id", user.id);
    setTier("premium");
  };

  if (loading) return null;

  return (
    <div className="p-6 pt-12 pb-32 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="flex justify-center mb-6">
        <AnimatedPanda message={tier === "free" ? "Premium members only!" : "AI systems active!"} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">AI Coach</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Smart routine analysis.</p>
      </motion.div>

      {tier === "free" ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center mt-10">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-center space-y-6 relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Unlock Insights</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Get personalized AI feedback, fatigue tracking, and optimal rest suggestions.</p>
            <button onClick={upgradeToPremium} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold p-4 rounded-xl shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex justify-center items-center gap-2">
              <Sparkles size={18} /> Start Free Trial
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 mt-10">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 shadow-xl text-center space-y-4">
            <Zap className="mx-auto text-emerald-500 w-12 h-12 mb-2" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Premium Active</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Your workout data is being compiled. Check back after your next session for AI breakdown.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
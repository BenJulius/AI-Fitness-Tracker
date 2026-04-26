"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Trophy, Dumbbell, Share, UserCircle, Loader2, LogIn, UserPlus } from "lucide-react";

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("authenticated");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (isMounted) {
            setAuthStatus("unauthenticated");
            setLoading(false);
          }
          return;
        }

        const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();

        if (profileError || !profileData) {
          if (isMounted) {
            setAuthStatus("needs_onboarding");
            setLoading(false);
          }
          return;
        }

        const { data: workoutsData } = await supabase.from("workouts").select("*").order("created_at", { ascending: false });
        
        if (isMounted) {
          setProfile(profileData);
          setWorkouts(workoutsData || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setAuthStatus("unauthenticated");
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const forceHardLoginRedirect = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <UserCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expired</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 max-w-xs">You have been signed out. Please log in again to view your dashboard.</p>
        <button onClick={forceHardLoginRedirect} className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
          <LogIn size={18} /> Return to Login
        </button>
      </div>
    );
  }

  if (authStatus === "needs_onboarding") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <UserPlus className="w-16 h-16 text-blue-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profile Missing</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 max-w-xs">We couldn't find your account details. Let's get you set up.</p>
        <button onClick={() => window.location.href = "/onboarding"} className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
          Complete Setup
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const totalXP = profile.total_xp || 0;
  const currentLevel = Math.floor(totalXP / 1000) + 1;
  const progressPercent = ((totalXP % 1000) / 1000) * 100;
  const totalSets = workouts.length;
  const uniqueDays = [...new Set(workouts.map(w => w.created_at.split('T')[0]))].length;

  return (
    <div className="p-6 pt-12 space-y-6 pb-32 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, rotateY: 10 }} 
        animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
        transition={{ type: "spring", bounce: 0.4 }}
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 p-1 rounded-3xl shadow-2xl overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[22px] p-6 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full" />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-16 h-16 rounded-full border-2 border-white/20 shadow-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                <UserCircle className="w-8 h-8 text-white/50" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-black tracking-tight">{profile.username ? `@${profile.username}` : "Athlete"}</h2>
              <div className="flex items-center gap-1.5 mt-1 bg-white/10 px-2 py-0.5 rounded-full w-fit border border-white/5">
                <Trophy size={12} className="text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">Level {currentLevel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 mb-6">
            <div className="bg-black/30 p-3 rounded-xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Active Days</p>
              <p className="text-2xl font-black">{uniqueDays}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Total Sets</p>
              <p className="text-2xl font-black">{totalSets}</p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-xs font-bold text-white/50 mb-2">
              <span>{totalXP % 1000} XP</span>
              <span>1000 XP</span>
            </div>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center relative z-10 opacity-70">
             <div className="flex items-center gap-1.5">
               <Dumbbell size={14} className="text-blue-400" />
               <span className="font-bold text-xs">FitAI App</span>
             </div>
             <span className="text-[10px] font-medium tracking-widest">FITAI.APP/{profile.username ? `@${profile.username}` : ''}</span>
          </div>
        </div>
      </motion.div>

      <button className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold p-4 rounded-2xl active:scale-95 transition-transform">
        <Share size={18} /> Share Stats
      </button>

    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2, TrendingUp, Calendar, Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ExerciseStats({ params }) {
  const router = useRouter();
  const exerciseName = decodeURIComponent(params.name);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("STATS");
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchExerciseData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("exercise", exerciseName)
        .order("created_at", { ascending: true });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      let totalSets = data.length;
      let totalReps = 0;
      let totalVolume = 0;
      
      let maxWeight = { val: 0, date: null };
      let max1RM = { val: 0, date: null };
      let maxReps = { val: 0, date: null };
      let maxSetVolume = { val: 0, date: null };
      
      let sessions = {};

      data.forEach(set => {
        const dateRaw = set.created_at.split('T')[0];
        const formattedDate = format(parseISO(dateRaw), "MMM do yyyy");
        
        const vol = set.weight * set.reps;
        const orm = set.weight * (1 + set.reps / 30);

        totalReps += set.reps;
        totalVolume += vol;

        if (!sessions[dateRaw]) {
          sessions[dateRaw] = { date: dateRaw, displayDate: formattedDate, volume: 0, reps: 0, max1RM: 0 };
        }
        sessions[dateRaw].volume += vol;
        sessions[dateRaw].reps += set.reps;
        if (orm > sessions[dateRaw].max1RM) sessions[dateRaw].max1RM = Math.round(orm);

        if (set.weight > maxWeight.val) maxWeight = { val: set.weight, date: formattedDate };
        if (orm > max1RM.val) max1RM = { val: Math.round(orm), date: formattedDate };
        if (set.reps > maxReps.val) maxReps = { val: set.reps, date: formattedDate };
        if (vol > maxSetVolume.val) maxSetVolume = { val: vol, date: formattedDate };
      });

      let maxSessionVol = { val: 0, date: null };
      let maxSessionReps = { val: 0, date: null };

      const graphData = [];

      Object.values(sessions).forEach(s => {
        graphData.push(s);
        if (s.volume > maxSessionVol.val) maxSessionVol = { val: s.volume, date: s.displayDate };
        if (s.reps > maxSessionReps.val) maxSessionReps = { val: s.reps, date: s.displayDate };
      });

      setChartData(graphData);
      setStats({
        workouts: Object.keys(sessions).length,
        sets: totalSets,
        reps: totalReps,
        volume: totalVolume,
        maxWeight,
        max1RM,
        maxReps,
        maxSessionReps,
        maxSetVolume,
        maxSessionVol
      });
      
      setLoading(false);
    };

    fetchExerciseData();
  }, [exerciseName, router]);

  const StatCard = ({ title, value, unit, date }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
      <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-blue-400">{value.toLocaleString()}</span>
        {unit && <span className="text-sm font-bold text-blue-400/50">{unit}</span>}
      </div>
      {date && <p className="text-slate-500 text-xs mt-2 font-medium">{date}</p>}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-32 max-w-md mx-auto relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
          <ChevronLeft size={20} className="text-slate-400" />
        </button>
        <h1 className="text-2xl font-black tracking-tight flex-1">{exerciseName}</h1>
      </div>

      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
        {["RECORDS", "STATS", "GRAPH"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === tab ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "STATS" && stats && (
          <motion.div key="stats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-2 gap-3">
            <StatCard title="Total Workouts" value={stats.workouts} />
            <StatCard title="Total Sets" value={stats.sets} />
            <StatCard title="Total Reps" value={stats.reps} />
            <StatCard title="Total Volume" value={stats.volume} unit="lbs" />
            <StatCard title="Workout Reps" value={stats.maxSessionReps.val} date={stats.maxSessionReps.date} />
            <StatCard title="Workout Volume" value={stats.maxSessionVol.val} unit="lbs" date={stats.maxSessionVol.date} />
          </motion.div>
        )}

        {activeTab === "RECORDS" && stats && (
          <motion.div key="records" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="grid grid-cols-2 gap-3">
            <StatCard title="Max Weight" value={stats.maxWeight.val} unit="lbs" date={stats.maxWeight.date} />
            <StatCard title="Estimated 1RM" value={stats.max1RM.val} unit="lbs" date={stats.max1RM.date} />
            <StatCard title="Max Reps (Set)" value={stats.maxReps.val} date={stats.maxReps.date} />
            <StatCard title="Max Volume (Set)" value={stats.maxSetVolume.val} unit="lbs" date={stats.maxSetVolume.date} />
          </motion.div>
        )}

        {activeTab === "GRAPH" && (
          <motion.div key="graph" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400" /> Estimated 1RM Progression
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="color1rm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="displayDate" hide />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Area type="monotone" dataKey="max1RM" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#color1rm)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Trophy size={14} className="text-purple-400" /> Volume Progression
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="displayDate" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#c084fc' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
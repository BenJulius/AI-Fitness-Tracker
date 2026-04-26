"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, History, Trash2, Dumbbell, X, CheckCircle2, ChevronDown } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";

export default function Log() {
  const [exercises, setExercises] = useState([]);
  const [todaysWorkouts, setTodaysWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [sets, setSets] = useState([{ reps: "", weight: "" }]);
  const [saving, setSaving] = useState(false);

  const [editingExercise, setEditingExercise] = useState(null);

  const fetchData = async () => {
    const [workoutsRes, exercisesRes] = await Promise.all([
      supabase.from("workouts").select("*").order("created_at", { ascending: true }),
      supabase.from("exercises").select("*")
    ]);
    
    if (workoutsRes.data) {
      const today = workoutsRes.data.filter(w => isSameDay(parseISO(w.created_at), new Date()));
      setTodaysWorkouts(today);
    }
    if (exercisesRes.data) setExercises(exercisesRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    const fetchLastSet = async () => {
      const { data } = await supabase.from("workouts")
        .select("reps, weight").eq("exercise", selectedExercise).order("created_at", { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setSets([{ reps: data[0].reps.toString(), weight: data[0].weight.toString() }]);
      } else {
        setSets([{ reps: "", weight: "" }]);
      }
    };
    fetchLastSet();
  }, [selectedExercise]);

  const addSet = () => setSets([...sets, { reps: "", weight: "" }]);
  const removeSet = (index) => sets.length > 1 && setSets(sets.filter((_, i) => i !== index));
  const updateSet = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const saveNewExercise = async (e) => {
    e.preventDefault();
    if (!selectedExercise) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const insertData = sets.filter(s => s.reps && s.weight).map(s => ({
      user_id: user.id, exercise: selectedExercise, reps: Number(s.reps), weight: Number(s.weight)
    }));
    
    if (insertData.length > 0) {
      await supabase.from("workouts").insert(insertData);
      
      if (todaysWorkouts.length === 0) {
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
        if (profile) {
          await supabase.from('profiles').update({ total_xp: (profile.total_xp || 0) + 100 }).eq('id', user.id);
        }
      }
      
      await fetchData();
    }
    
    setSelectedExercise("");
    setSets([{ reps: "", weight: "" }]);
    setIsLogging(false);
    setSaving(false);
  };

  const deleteLoggedSet = async (id) => {
    const updatedWorkouts = todaysWorkouts.filter(w => w.id !== id);
    setTodaysWorkouts(updatedWorkouts);
    
    if (editingExercise) {
      const remainingForExercise = updatedWorkouts.filter(w => w.exercise === editingExercise);
      if (remainingForExercise.length === 0) setEditingExercise(null);
    }

    await supabase.from("workouts").delete().eq("id", id);
  };

  const updateLoggedSet = async (id, field, value) => {
    if (value === "") return; 
    
    setTodaysWorkouts(prev => prev.map(w => w.id === id ? { ...w, [field]: Number(value) } : w));
    await supabase.from("workouts").update({ [field]: Number(value) }).eq("id", id);
  };

  const updateExerciseName = async (oldName, newName) => {
    if (!newName || oldName === newName) return;
    
    const idsToUpdate = todaysWorkouts.filter(w => w.exercise === oldName).map(w => w.id);
    
    setTodaysWorkouts(prev => prev.map(w => w.exercise === oldName ? { ...w, exercise: newName } : w));
    setEditingExercise(newName);
    
    await supabase.from("workouts").update({ exercise: newName }).in("id", idsToUpdate);
  };

  const addSetToExistingExercise = async (exerciseName) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const existingSets = todaysWorkouts.filter(w => w.exercise === exerciseName);
    const lastSet = existingSets[existingSets.length - 1];

    const newSet = {
      user_id: user.id,
      exercise: exerciseName,
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet ? lastSet.weight : 0
    };

    const { data } = await supabase.from("workouts").insert([newSet]).select();
    if (data && data.length > 0) {
      setTodaysWorkouts([...todaysWorkouts, data[0]]);
    }
  };

  const groupedToday = todaysWorkouts.reduce((acc, workout) => {
    if (!acc[workout.exercise]) acc[workout.exercise] = [];
    acc[workout.exercise].push(workout);
    return acc;
  }, {});

  if (loading) return null;

  return (
    <div className="p-6 pt-12 pb-32 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors relative">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Active Workout</h1>
          <p className="text-emerald-500 font-bold text-sm mt-1 flex items-center gap-1">
            <CheckCircle2 size={14} /> Today's Session
          </p>
        </div>
        {!isLogging && (
          <button onClick={() => setIsLogging(true)} className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all">
            <Plus size={24} />
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {!isLogging ? (
          <motion.div key="daily-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {Object.keys(groupedToday).length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 border-dashed">
                <Dumbbell className="mx-auto w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-slate-500 dark:text-slate-400 font-medium">No exercises logged yet today.</h3>
                <button onClick={() => setIsLogging(true)} className="mt-4 px-6 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                  Start Logging
                </button>
              </div>
            ) : (
              Object.keys(groupedToday).map((exerciseName) => (
                <motion.div 
                  key={exerciseName} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingExercise(exerciseName)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer space-y-3 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">{exerciseName}</h3>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {groupedToday[exerciseName].map((set, index) => (
                      <div key={set.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-xs">{index + 1}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {set.weight} <span className="text-[10px] uppercase text-slate-400 font-medium">lbs</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-bold">×</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{set.reps}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.form key="log-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onSubmit={saveNewExercise} className="space-y-6">
             <div className="flex justify-between items-center mb-2 px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Exercise</h2>
              <button type="button" onClick={() => setIsLogging(false)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Movement</label>
                <select className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl w-full text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold appearance-none"
                  required value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
                  <option value="">Choose...</option>
                  {exercises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sets Data</label>
                  {sets[0]?.weight && <span className="text-[10px] text-emerald-500 flex items-center gap-1"><History size={12}/> Auto-filled</span>}
                </div>
                
                {sets.map((set, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                    <input className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Lbs" type="number" required value={set.weight} onChange={(e) => updateSet(i, 'weight', e.target.value)} />
                    <span className="text-slate-400 font-medium">×</span>
                    <input className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Reps" type="number" required value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} />
                    <button type="button" onClick={() => removeSet(i)} disabled={sets.length === 1} className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addSet} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                <Plus size={18} /> Add Set
              </button>
            </div>

            <button disabled={saving || !selectedExercise} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black p-5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
              {saving ? "Saving..." : <><Save size={20} /> Save Exercise</>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* --- PLAYING CARD EDIT MODAL --- */}
      <AnimatePresence>
        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Blurred Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-md"
              onClick={() => setEditingExercise(null)}
            />
            
            {/* Horizontal Swipeable Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1, x: 0 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="x" // Changed to X-axis dragging
              dragConstraints={{ left: 0, right: 0 }} // Snaps back to center if not swiped far enough
              dragElastic={0.7}
              onDragEnd={(e, { offset, velocity }) => {
                // Close if swiped left or right far enough, or fast enough
                if (Math.abs(offset.x) > 120 || Math.abs(velocity.x) > 600) {
                  setEditingExercise(null); 
                }
              }}
              className="relative w-full max-w-sm max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col z-10 cursor-grab active:cursor-grabbing overflow-hidden border border-slate-200 dark:border-white/10"
            >
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Drag Hint at the top */}
                <div className="w-full flex justify-center mb-6">
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="relative flex-1 mr-4">
                     <select 
                        value={editingExercise} 
                        onChange={(e) => updateExerciseName(editingExercise, e.target.value)}
                        className="font-black text-2xl bg-transparent text-slate-900 dark:text-white w-full focus:outline-none appearance-none cursor-pointer"
                      >
                        {!exercises.some(e => e.name === editingExercise) && (
                          <option value={editingExercise}>{editingExercise}</option>
                        )}
                        {exercises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  
                  <button onClick={() => setEditingExercise(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 z-20 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="w-8">Set</span>
                    <span className="flex-1 text-center">Lbs</span>
                    <span className="w-4"></span>
                    <span className="flex-1 text-center">Reps</span>
                    <span className="w-8"></span>
                  </div>

                  <AnimatePresence>
                    {groupedToday[editingExercise]?.map((set, index) => (
                      <motion.div 
                        key={set.id} 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mb-3"
                      >
                        <span className="w-8 text-center text-sm font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          {index + 1}
                        </span>
                        <input 
                          type="number" 
                          value={set.weight || ""} 
                          onChange={(e) => updateLoggedSet(set.id, 'weight', e.target.value)}
                          className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 text-center font-bold text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-100 dark:border-slate-800 transition-all cursor-text" 
                          onPointerDownCapture={e => e.stopPropagation()} // Allows editing inputs without triggering drag
                        />
                        <span className="text-slate-300 dark:text-slate-600 font-bold">×</span>
                        <input 
                          type="number" 
                          value={set.reps || ""} 
                          onChange={(e) => updateLoggedSet(set.id, 'reps', e.target.value)}
                          className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 text-center font-bold text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-100 dark:border-slate-800 transition-all cursor-text" 
                          onPointerDownCapture={e => e.stopPropagation()} // Allows editing inputs without triggering drag
                        />
                        <button onClick={() => deleteLoggedSet(set.id)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors z-20" onPointerDownCapture={e => e.stopPropagation()}>
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button 
                    onClick={() => addSetToExistingExercise(editingExercise)} 
                    className="w-full mt-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 z-20"
                    onPointerDownCapture={e => e.stopPropagation()}
                  >
                    <Plus size={18} /> Add Another Set
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
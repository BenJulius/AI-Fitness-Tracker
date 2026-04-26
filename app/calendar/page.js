"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Pencil, Trash2, Plus, Save, X, Dumbbell, ChevronDown
} from "lucide-react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  parseISO, addWeeks, subWeeks 
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Helper to determine dot color based on exercise name
const getCategoryColor = (exerciseName) => {
  const name = (exerciseName || "").toLowerCase();
  if (name.includes('chest') || name.includes('bench') || name.includes('pec')) return 'bg-blue-500';
  if (name.includes('leg') || name.includes('squat') || name.includes('calf')) return 'bg-red-500';
  if (name.includes('back') || name.includes('row') || name.includes('pull')) return 'bg-emerald-500';
  if (name.includes('arm') || name.includes('curl') || name.includes('tri')) return 'bg-purple-500';
  if (name.includes('shoulder') || name.includes('press') || name.includes('delt')) return 'bg-orange-500';
  if (name.includes('core') || name.includes('abs') || name.includes('crunch')) return 'bg-yellow-500';
  return 'bg-slate-400 dark:bg-slate-600';
};

export default function Calendar() {
  const [workouts, setWorkouts] = useState([]);
  const [exercisesList, setExercisesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Retroactive Log Popup State (For Adding NEW exercises to a past day)
  const [isLogPopupOpen, setIsLogPopupOpen] = useState(false);
  const [editSets, setEditSets] = useState([{ reps: "", weight: "" }]);
  const [editExercise, setEditExercise] = useState("");
  const [saving, setSaving] = useState(false);

  // Swipeable Edit Card State
  const [editingExercise, setEditingExercise] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(0); // Tracks exit animation direction

  const fetchData = async () => {
    const [workoutsRes, exercisesRes] = await Promise.all([
      supabase.from("workouts").select("*").order("created_at", { ascending: true }),
      supabase.from("exercises").select("*")
    ]);
    if (workoutsRes.data) setWorkouts(workoutsRes.data);
    if (exercisesRes.data) setExercisesList(exercisesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nextTimeframe = () => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prevTimeframe = () => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));

  // --- Add New Exercise Logic ---
  const openLogPopup = () => {
    setEditExercise("");
    setEditSets([{ reps: "", weight: "" }]);
    setIsLogPopupOpen(true);
  };

  const saveRetroactiveLog = async (e) => {
    e.preventDefault();
    if (!editExercise || !selectedDay) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const dateObj = new Date(selectedDay);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const insertData = editSets.filter(s => s.reps && s.weight).map(s => ({
      user_id: user.id, 
      exercise: editExercise, 
      reps: Number(s.reps), 
      weight: Number(s.weight),
      created_at: dateObj.toISOString()
    }));
    
    if (insertData.length > 0) {
      await supabase.from("workouts").insert(insertData);
      await fetchData();
    }
    
    setSaving(false);
    setIsLogPopupOpen(false);
  };

  // --- Edit Card Logic (Tinder Card) ---
  const closeEditCard = () => {
    setSwipeDirection(0); // Reset for standard fade/scale close
    setEditingExercise(null);
  };

  const handleDragEnd = (e, { offset, velocity }) => {
    const swipeThreshold = 100;
    if (offset.x > swipeThreshold || velocity.x > 500) {
      setSwipeDirection(window.innerWidth);
      setEditingExercise(null);
    } else if (offset.x < -swipeThreshold || velocity.x < -500) {
      setSwipeDirection(-window.innerWidth);
      setEditingExercise(null);
    }
  };

  const updateLoggedSet = async (id, field, value) => {
    if (value === "") return;
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, [field]: Number(value) } : w));
    await supabase.from("workouts").update({ [field]: Number(value) }).eq("id", id);
  };

  const deleteLoggedSet = async (id) => {
    const updatedWorkouts = workouts.filter(w => w.id !== id);
    setWorkouts(updatedWorkouts);

    if (editingExercise) {
      const remaining = updatedWorkouts.filter(w => w.exercise === editingExercise && isSameDay(parseISO(w.created_at), selectedDay));
      if (remaining.length === 0) closeEditCard();
    }
    await supabase.from("workouts").delete().eq("id", id);
  };

  const updateExerciseName = async (oldName, newName) => {
    if (!newName || oldName === newName) return;
    
    // Only update for the specifically selected day
    const dayWorkouts = workouts.filter(w => isSameDay(parseISO(w.created_at), selectedDay));
    const idsToUpdate = dayWorkouts.filter(w => w.exercise === oldName).map(w => w.id);
    
    setWorkouts(prev => prev.map(w => idsToUpdate.includes(w.id) ? { ...w, exercise: newName } : w));
    setEditingExercise(newName);
    
    await supabase.from("workouts").update({ exercise: newName }).in("id", idsToUpdate);
  };

  const addSetToExistingExercise = async (exerciseName) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const dayWorkouts = workouts.filter(w => isSameDay(parseISO(w.created_at), selectedDay));
    const existingSets = dayWorkouts.filter(w => w.exercise === exerciseName);
    const lastSet = existingSets[existingSets.length - 1];

    const dateObj = new Date(selectedDay);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const newSet = {
      user_id: user.id,
      exercise: exerciseName,
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet ? lastSet.weight : 0,
      created_at: dateObj.toISOString()
    };

    const { data } = await supabase.from("workouts").insert([newSet]).select();
    if (data && data.length > 0) {
      setWorkouts([...workouts, data[0]]);
    }
  };


  // --- Render Calendar Grid ---
  const renderGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = view === 'month' ? startOfWeek(monthStart) : startOfWeek(currentDate);
    const endDate = view === 'month' ? endOfWeek(monthEnd) : endOfWeek(currentDate);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayWorkouts = workouts.filter(w => isSameDay(parseISO(w.created_at), cloneDay));
        const dayCategories = [...new Set(dayWorkouts.map(w => getCategoryColor(w.exercise)))];

        days.push(
          <div 
            key={day} 
            onClick={() => setSelectedDay(cloneDay)}
            className={`p-2 flex flex-col items-center justify-start h-16 sm:h-20 border-b border-r border-slate-100 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50
              ${!isSameMonth(day, monthStart) && view === 'month' ? "text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-slate-900/50" : "text-slate-700 dark:text-slate-200"}
              ${isSameDay(day, new Date()) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}
              ${selectedDay && isSameDay(day, selectedDay) ? "ring-2 ring-inset ring-blue-500 bg-blue-50 dark:bg-slate-800" : ""}
            `}
          >
            <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center" : ""}`}>
              {formattedDate}
            </span>
            <div className="flex gap-1 mt-1 flex-wrap justify-center">
              {dayCategories.slice(0, 4).map((color, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full ${color}`} />
              ))}
              {dayCategories.length > 4 && <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return rows;
  };

  if (loading) return null;

  // Group Workouts for the Currently Selected Day
  const selectedDayWorkouts = selectedDay ? workouts.filter(w => isSameDay(parseISO(w.created_at), selectedDay)) : [];
  const groupedSelectedDay = selectedDayWorkouts.reduce((acc, workout) => {
    if (!acc[workout.exercise]) acc[workout.exercise] = [];
    acc[workout.exercise].push(workout);
    return acc;
  }, {});

  return (
    <div className="p-6 pt-12 pb-40 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500">
            <CalendarIcon size={20} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Calendar</h1>
        </div>
        
        {/* Toggle View */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          {['month', 'week'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all ${view === v ? 'bg-white dark:bg-slate-950 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Header & Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <button onClick={prevTimeframe} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button onClick={nextTimeframe} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="bg-white dark:bg-slate-900">
          {renderGrid()}
        </div>
      </div>

      {/* Selected Day View */}
      <AnimatePresence>
        {selectedDay && !isLogPopupOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">{format(selectedDay, "EEEE, MMMM d")}</h3>
                <p className="text-xs font-bold text-emerald-500 mt-1">{selectedDayWorkouts.length} sets logged</p>
              </div>
              <button onClick={openLogPopup} className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2 font-bold text-sm">
                <Plus size={16} /> Add 
              </button>
            </div>

            {Object.keys(groupedSelectedDay).length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 flex flex-col items-center">
                <Dumbbell className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Rest day, or forgot to log?</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {Object.keys(groupedSelectedDay).map((exerciseName) => {
                  const sets = groupedSelectedDay[exerciseName];
                  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);

                  return (
                    <motion.div 
                      key={exerciseName}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSwipeDirection(0);
                        setEditingExercise(exerciseName);
                      }}
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer group shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(exerciseName)}`} />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{exerciseName}</p>
                          <p className="text-xs text-slate-500 font-medium">{sets.length} {sets.length === 1 ? 'set' : 'sets'} • {totalReps} total reps</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Pencil size={14} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

{/* --- PLAYING CARD EDIT MODAL (Tinder Swipe) --- */}
<AnimatePresence>
  {editingExercise && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Blurred Overlay */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
        onClick={closeEditCard}
      />
      
      {/* Horizontal Swipeable Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1, x: 0 }} 
        exit={{ 
          scale: swipeDirection === 0 ? 0.9 : 1, 
          opacity: 0, 
          x: swipeDirection 
        }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        className="relative w-full max-w-sm max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col z-10 cursor-grab active:cursor-grabbing overflow-hidden border border-slate-200 dark:border-white/10"
      >
        <div className="p-6 overflow-y-auto flex-1">
          {/* Top Handle */}
          <div className="w-full flex justify-center mb-6">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="relative flex-1 mr-4">
               {/* Fixed Select Logic */}
               <select 
                  value={editingExercise} 
                  onChange={(e) => updateExerciseName(editingExercise, e.target.value)}
                  onPointerDownCapture={e => e.stopPropagation()} // CRITICAL: Allows interaction without dragging
                  className="font-black text-2xl bg-transparent text-slate-900 dark:text-white w-full focus:outline-none appearance-none cursor-pointer pr-8"
                >
                  {!exercisesList.some(e => e.name === editingExercise) && (
                    <option value={editingExercise}>{editingExercise}</option>
                  )}
                  {exercisesList.map(e => (
                    <option key={e.id} value={e.name} className="dark:bg-slate-900">
                      {e.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            <button onClick={closeEditCard} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 z-20">
              <X size={16} />
            </button>
          </div>

          {/* Sets Breakdown Section */}
          <div className="space-y-3">
            <div className="flex px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="w-8">Set</span>
              <span className="flex-1 text-center">Lbs</span>
              <span className="w-4"></span>
              <span className="flex-1 text-center">Reps</span>
              <span className="w-8"></span>
            </div>

            <AnimatePresence>
              {(groupedSelectedDay[editingExercise] || []).map((set, index) => (
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
                    onPointerDownCapture={e => e.stopPropagation()} 
                    className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 text-center font-bold text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-100 dark:border-slate-800" 
                  />
                  <span className="text-slate-300 dark:text-slate-600 font-bold">×</span>
                  <input 
                    type="number" 
                    value={set.reps || ""} 
                    onChange={(e) => updateLoggedSet(set.id, 'reps', e.target.value)}
                    onPointerDownCapture={e => e.stopPropagation()}
                    className="flex-1 w-full min-w-0 p-3 bg-slate-50 dark:bg-slate-950 text-center font-bold text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-100 dark:border-slate-800" 
                  />
                  <button 
                    onClick={() => deleteLoggedSet(set.id)} 
                    onPointerDownCapture={e => e.stopPropagation()}
                    className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <button 
              onClick={() => addSetToExistingExercise(editingExercise)} 
              onPointerDownCapture={e => e.stopPropagation()}
              className="w-full mt-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-bold flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Add Set
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* --- ADD NEW EXERCISE POPUP (Bottom Sheet) --- */}
      <AnimatePresence>
        {isLogPopupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
              
              <button onClick={() => setIsLogPopupOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>

              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Add Exercise</h2>
              <p className="text-sm font-bold text-blue-500 mb-6">{format(selectedDay, "EEEE, MMMM d")}</p>

              <form onSubmit={saveRetroactiveLog} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Exercise</label>
                  <select required value={editExercise} onChange={(e) => setEditExercise(e.target.value)}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold appearance-none">
                    <option value="">Select Exercise...</option>
                    {exercisesList.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sets to Add</label>
                  {editSets.map((set, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold w-4 text-sm">{i + 1}</span>
                      <input type="number" required placeholder="Lbs" value={set.weight} 
                        onChange={(e) => { const newSets = [...editSets]; newSets[i].weight = e.target.value; setEditSets(newSets); }}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full text-center font-bold text-slate-900 dark:text-white focus:border-blue-500" />
                      <span className="text-slate-400 font-medium">×</span>
                      <input type="number" required placeholder="Reps" value={set.reps} 
                        onChange={(e) => { const newSets = [...editSets]; newSets[i].reps = e.target.value; setEditSets(newSets); }}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full text-center font-bold text-slate-900 dark:text-white focus:border-blue-500" />
                      <button type="button" onClick={() => setEditSets(editSets.filter((_, idx) => idx !== i))} disabled={editSets.length === 1} 
                        className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => setEditSets([...editSets, { reps: "", weight: "" }])} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                  <Plus size={18} /> Add Set
                </button>

                <button disabled={saving || !editExercise} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black p-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                  {saving ? "Saving..." : <><Save size={20} /> Save to {format(selectedDay, "MMM d")}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
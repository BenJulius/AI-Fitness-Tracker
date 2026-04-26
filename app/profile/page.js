"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, UserCircle, Loader2, AlertCircle, CheckCircle2, LogOut, Trash2, Edit2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInDays } from "date-fns";
import AvatarPicker from "@/components/AvatarPicker"; // <-- Imported our new picker!

// Helper to render the emoji at the top of the page
const getAvatarIcon = (id) => {
  const icons = {
    shark: "🦈", elk: "🦌", bear: "🐻", lion: "🦁",
    eagle: "🦅", scorpion: "🦂", gator: "🐊", panda: "🐼"
  };
  return icons[id] || "🐼"; 
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ age: "", weight: "", goal: "", avatar: "panda" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
        setUsername(data?.username || "");
        setEditForm({
          age: data?.age || "",
          weight: data?.weight || "",
          goal: data?.goal || "",
          avatar: data?.avatar || "panda" // Load their saved avatar
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const saveUsername = async () => {
    setUsernameError("");
    setUsernameSuccess("");
    
    if (profile.last_username_change) {
      const daysSinceChange = differenceInDays(new Date(), new Date(profile.last_username_change));
      if (daysSinceChange < 30) {
        setUsernameError(`You can change your username again in ${30 - daysSinceChange} days.`);
        return;
      }
    }

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single();
    if (existing && existing.id !== profile.id) {
      setUsernameError("Username already taken.");
      return;
    }

    const isoDate = new Date().toISOString();
    await supabase.from('profiles').update({ 
      username, 
      last_username_change: isoDate 
    }).eq('id', profile.id);
    
    setProfile({ ...profile, last_username_change: isoDate });
    setUsernameSuccess("Username updated!");
  };

  const saveProfileDetails = async () => {
    setSavingProfile(true);
    await supabase.from('profiles').update({
      age: parseInt(editForm.age) || null,
      weight: parseFloat(editForm.weight) || null,
      goal: editForm.goal,
      avatar: editForm.avatar // Save the new avatar choice to the database!
    }).eq('id', profile.id);
    
    setProfile({ ...profile, age: editForm.age, weight: editForm.weight, goal: editForm.goal, avatar: editForm.avatar });
    setIsEditing(false);
    setSavingProfile(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('profiles').delete().eq('id', session.user.id);
        await supabase.auth.signOut();
        window.location.href = "/";
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
  if (!profile) return null;

  return (
    <div className="p-6 pt-12 pb-32 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 mb-8">
        
        {/* New Avatar Display */}
        <div className="relative w-28 h-28 rounded-full bg-slate-900 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-6xl shadow-blue-500/20">
          {getAvatarIcon(profile?.avatar)}
        </div>
        
        <div className="w-full space-y-2 mt-4">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 ring-blue-500 transition-all">
            <span className="text-slate-400 font-bold px-3">@</span>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className="bg-transparent flex-1 font-bold text-slate-900 dark:text-white outline-none"
            />
            <button onClick={saveUsername} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
              Save
            </button>
          </div>
          {usernameError && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {usernameError}</p>}
          {usernameSuccess && <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> {usernameSuccess}</p>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Account Details</h2>
          <button onClick={() => setIsEditing(!isEditing)} className="text-blue-500 hover:text-blue-600 transition-colors p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="editing" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* Avatar Picker injected right into your edit form */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <AvatarPicker 
                  selectedAvatar={editForm.avatar} 
                  onSelect={(id) => setEditForm({...editForm, avatar: id})} 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                  <input type="number" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Weight (lbs)</label>
                  <input type="number" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Primary Goal</label>
                  <select value={editForm.goal} onChange={(e) => setEditForm({...editForm, goal: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select a goal</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="lose_fat">Lose Fat</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>
              </div>

              <button onClick={saveProfileDetails} disabled={savingProfile} className="w-full mt-4 bg-blue-500 text-white font-bold p-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/25">
                {savingProfile ? "Saving..." : <><Save size={18} /> Save Changes</>}
              </button>
            </motion.div>
          ) : (
            <motion.div key="viewing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    Stats 
                    <button onClick={() => setShowStats(!showStats)} className="text-blue-500 hover:text-blue-400 p-1">
                      {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </label>
                  <div className="mt-1 transition-all">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {showStats ? `${profile?.weight || 0} lbs` : "*** lbs"}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {profile?.age ? `${profile.age} years old` : "Age not set"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Subscription</p>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.tier === 'premium' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                     {profile?.tier || 'Free'}
                   </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Goal</label>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize mt-1">
                  {profile?.goal?.replace('_', ' ') || "Not set"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 p-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
          <LogOut size={18} /> Log Out
        </button>
        <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 p-4 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
          <Trash2 size={18} /> Delete Account
        </button>
      </motion.div>
    </div>
  );
}
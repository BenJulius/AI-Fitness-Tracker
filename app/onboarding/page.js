"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import AnimatedPanda from "@/components/AnimatedPanda"
import AvatarPicker from "@/components/AvatarPicker"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, Sparkles, AlertCircle, ChevronLeft, Edit3, UserCheck } from "lucide-react"

export default function Onboarding() {
  const [step, setStep] = useState(1)
  // Added 'avatar' to formData with a default value
  const [formData, setFormData] = useState({ age: "", weight: "", goal: "", username: "", avatar: "panda" })
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [validationError, setValidationError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const rawName = user.user_metadata?.full_name || user.user_metadata?.name || "Athlete"
        const base = rawName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const first = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
        setSuggestions([base, `${base}${Math.floor(Math.random() * 99) + 1}`, `${first}_lifts`]);
      }
    }
    getUserData()
  }, [])

  const nextStep = () => {
    setValidationError("")
    if (step === 1 && !formData.age) return setValidationError("Age is required to build your profile.")
    if (step === 2 && !formData.weight) return setValidationError("Weight is required for accurate tracking.")
    if (step === 3 && !formData.goal) return setValidationError("Please select a goal.")
    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setValidationError("")
    setStep(prev => prev - 1)
  }

  const handleUsernameStep = async () => {
    setValidationError("")
    if (!formData.username || formData.username.length < 3) {
      setValidationError("Username must be at least 3 characters.")
      return
    }
    setCheckingUsername(true)
    const { data } = await supabase.from("profiles").select("id").eq("username", formData.username).maybeSingle()
    setCheckingUsername(false)
    
    if (data) {
      setValidationError("That handle is already taken.")
      return
    }
    setStep(5) // Move to Avatar Step
  }

  const finishSignup = async (tier) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        age: parseInt(formData.age) || null,
        weight: parseFloat(formData.weight) || null,
        goal: formData.goal,
        username: formData.username,
        avatar: formData.avatar, // Saving the new avatar!
        tier: tier 
      })

      if (error) {
        alert("Database Error: " + error.message)
        console.error("Full Supabase Error:", error)
        setLoading(false)
        return
      }
    }
    
    window.location.href = "/dashboard"
  }

  return (
    <div className="flex flex-col h-screen p-6 justify-center max-w-md mx-auto bg-slate-950">
      <div className="flex justify-center mb-8">
        <AnimatedPanda message={step === 7 ? "Looking sharp, Athlete!" : "Let's build your perfect plan!"} />
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative">
        {step > 1 && (
          <button onClick={prevStep} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="text-sm text-slate-500 mb-4 font-bold tracking-widest uppercase text-center">
          {step === 7 ? "Confirm Profile" : `Step ${step} of 6`}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">How old are you?</h2>
              <input type="number" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 text-white font-bold text-center outline-none" placeholder="Years" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Current weight?</h2>
              <input type="number" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 text-white font-bold text-center outline-none" placeholder="lbs" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Primary Goal?</h2>
              <select className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold outline-none cursor-pointer" value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})}>
                <option value="">Select a goal</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="lose_fat">Lose Fat</option>
                <option value="endurance">Endurance</option>
              </select>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Claim your Handle</h2>
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-3 focus-within:border-emerald-500">
                <span className="text-slate-400 font-bold px-2">@</span>
                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder="username" className="bg-transparent w-full font-bold text-white outline-none" />
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {suggestions.map((sug, i) => (
                  <button key={i} type="button" onClick={() => setFormData({...formData, username: sug})} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">@{sug}</button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <AvatarPicker 
                selectedAvatar={formData.avatar} 
                onSelect={(id) => setFormData({...formData, avatar: id})} 
              />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-2">
              <div className="inline-block p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full"><Sparkles className="text-pink-400 w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Panda Premium</h2>
              <div className="text-left bg-white/5 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                <p className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle2 className="text-emerald-400 w-4 h-4" /> AI Routine Analysis</p>
                <p className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle2 className="text-emerald-400 w-4 h-4" /> Goal Tracking</p>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="text-2xl font-bold text-white text-center">Ready to start?</h2>
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Handle</span><span className="text-white font-black">@{formData.username}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Avatar</span><span className="text-white font-black capitalize">{formData.avatar}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Age</span><span className="text-white font-black">{formData.age}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Weight</span><span className="text-white font-black">{formData.weight} lbs</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Goal</span><span className="text-white font-black capitalize">{formData.goal.replace('_', ' ')}</span></div>
              </div>
              <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase"><Edit3 size={14} /> Change details</button>
            </motion.div>
          )}
        </AnimatePresence>

        {validationError && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-xs font-bold mt-4 justify-center">
            <AlertCircle size={14} /> {validationError}
          </motion.div>
        )}

        <div className="mt-8">
          {step < 4 && (
            <button onClick={nextStep} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Continue</button>
          )}
          {step === 4 && (
            <button onClick={handleUsernameStep} disabled={checkingUsername} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50">{checkingUsername ? "Verifying..." : "Continue"}</button>
          )}
          {step === 5 && (
            <button onClick={() => setStep(6)} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Continue</button>
          )}
          {step === 6 && (
            <button onClick={() => setStep(7)} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all">Review Profile</button>
          )}
          {step === 7 && (
            <div className="w-full flex flex-col gap-4">
              <button onClick={() => finishSignup("premium")} disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? "Saving..." : <><UserCheck size={20} /> Join as Premium</>}
              </button>
              <button onClick={() => finishSignup("free")} disabled={loading} className="text-xs text-slate-500 font-bold hover:text-white text-center transition-colors">Setup Free Account</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
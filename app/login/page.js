"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import AnimatedPanda from "@/components/AnimatedPanda"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (isLogin) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
      } else {
        router.push("/dashboard")
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
      } else {
        router.push("/onboarding")
      }
    }
  }

  return (
    <div className="px-6 flex flex-col justify-center h-full max-w-sm mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <AnimatedPanda message={isLogin ? "Welcome back, boss!" : "Let's get you signed up!"} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">FitAI</h1>
        <p className="text-slate-400 mt-2 font-medium">{isLogin ? "Sign in to continue" : "Create an account"}</p>
      </motion.div>

      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} onSubmit={handleAuth} className="space-y-4">
        {error && <p className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg">{error}</p>}
        
        <input 
          className="p-4 bg-white/5 border border-white/10 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
          type="email"
          placeholder="Email Address"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input 
          className="p-4 bg-white/5 border border-white/10 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button 
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white p-4 rounded-xl w-full font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
        >
          {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
        </button>
      </motion.form>

      <motion.button 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        onClick={() => setIsLogin(!isLogin)} 
        className="text-sm text-slate-400 hover:text-white mt-8 mx-auto block transition-colors"
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </motion.button>
    </div>
  )
}
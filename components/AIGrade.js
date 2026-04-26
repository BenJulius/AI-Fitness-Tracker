"use client"
import { motion } from "framer-motion"

export default function AIGrade({ score = 85, feedback = "Incredible volume on legs today. Rest up tomorrow!" }) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  let color = "text-emerald-400"
  if (score < 70) color = "text-yellow-400"
  if (score < 50) color = "text-red-400"

  return (
    <div className="glass-panel p-6 flex items-center gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
      
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="8" fill="none" />
          <motion.circle 
            cx="50" cy="50" r="40" 
            className={`stroke-current ${color}`} 
            strokeWidth="8" fill="none" strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-2xl font-black ${color}`}>{score}</span>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Score</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          Panda AI Says:
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          "{feedback}"
        </p>
      </div>
    </div>
  )
}
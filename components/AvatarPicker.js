"use client"
import { motion } from "framer-motion"

const avatars = [
  { id: "shark", icon: "🦈", name: "Shark", shadow: "shadow-cyan-500/50", border: "border-cyan-500", bg: "bg-cyan-500/10" },
  { id: "elk", icon: "🦌", name: "Elk", shadow: "shadow-amber-500/50", border: "border-amber-500", bg: "bg-amber-500/10" },
  { id: "bear", icon: "🐻", name: "Bear", shadow: "shadow-stone-500/50", border: "border-stone-500", bg: "bg-stone-500/10" },
  { id: "lion", icon: "🦁", name: "Lion", shadow: "shadow-orange-500/50", border: "border-orange-500", bg: "bg-orange-500/10" },
  { id: "eagle", icon: "🦅", name: "Eagle", shadow: "shadow-slate-400/50", border: "border-slate-400", bg: "bg-slate-400/10" },
  { id: "scorpion", icon: "🦂", name: "Scorpion", shadow: "shadow-purple-500/50", border: "border-purple-500", bg: "bg-purple-500/10" },
  { id: "gator", icon: "🐊", name: "Gator", shadow: "shadow-emerald-500/50", border: "border-emerald-500", bg: "bg-emerald-500/10" },
  { id: "panda", icon: "🐼", name: "Panda", shadow: "shadow-blue-500/50", border: "border-blue-500", bg: "bg-blue-500/10" }
]

export default function AvatarPicker({ selectedAvatar, onSelect }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 text-center">
        Select your spirit animal
      </h3>
      
      <div className="grid grid-cols-4 gap-4">
        {avatars.map((avatar) => {
          const isSelected = selectedAvatar === avatar.id;
          
          return (
            <motion.button
              key={avatar.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(avatar.id)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300
                ${isSelected 
                  ? `${avatar.bg} ${avatar.border} border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${avatar.shadow}` 
                  : 'bg-slate-900 border-2 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }
              `}
            >
              <span className={`text-4xl drop-shadow-2xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100 grayscale-[0.3]'}`}>
                {avatar.icon}
              </span>
              
              {isSelected && (
                <motion.div 
                  layoutId="activeAvatar"
                  className="absolute -bottom-2 px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg"
                >
                  {avatar.name}
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
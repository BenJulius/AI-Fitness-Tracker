"use client"
import { motion } from "framer-motion"

export default function AnimatedPanda({ message = "Ready to crush some goals?", className = "" }) {
  return (
    <div className={`relative flex flex-col items-center justify-end h-44 w-full max-w-sm mx-auto ${className}`}>
      
      {/* Bouncy Glossy Text Bubble */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        className="relative z-20 bg-white text-slate-800 font-extrabold px-6 py-4 rounded-3xl rounded-br-sm shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-white/40 mb-[-15px] ml-[-40px]"
      >
        {message}
        {/* Chat Bubble Tail */}
        <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white transform rotate-45 border-b border-r border-slate-200"></div>
      </motion.div>

      {/* Peeking Animated Panda */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
        className="relative z-10 w-32 h-32 ml-16 drop-shadow-2xl"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Panda Head */}
          <circle cx="50" cy="60" r="38" fill="#ffffff" />
          
          {/* Outer Ears */}
          <circle cx="22" cy="32" r="14" fill="#0f172a" />
          <circle cx="78" cy="32" r="14" fill="#0f172a" />
          
          {/* Inner Ear Depth */}
          <circle cx="22" cy="32" r="6" fill="#1e293b" />
          <circle cx="78" cy="32" r="6" fill="#1e293b" />

          {/* Eye Patches */}
          <ellipse cx="32" cy="55" rx="10" ry="14" fill="#0f172a" transform="rotate(-20 32 55)" />
          <ellipse cx="68" cy="55" rx="10" ry="14" fill="#0f172a" transform="rotate(20 68 55)" />

          {/* Eyeballs with continuous blinking animation */}
          <motion.circle 
            animate={{ scaleY: [1, 0.1, 1] }} 
            transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.05, 0.1], repeatDelay: 0.5 }}
            cx="32" cy="53" r="4.5" fill="#ffffff" 
          />
          <motion.circle 
            animate={{ scaleY: [1, 0.1, 1] }} 
            transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.05, 0.1], repeatDelay: 0.5 }}
            cx="68" cy="53" r="4.5" fill="#ffffff" 
          />

          {/* Tiny Eye Sparkles (Anime style) */}
          <circle cx="29" cy="50" r="2" fill="#ffffff" />
          <circle cx="65" cy="50" r="2" fill="#ffffff" />

          {/* Cute Nose */}
          <ellipse cx="50" cy="65" rx="4.5" ry="3" fill="#0f172a" />

          {/* Little Smile */}
          <path d="M 44 70 Q 50 75 56 70" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Blushing Cheeks */}
          <ellipse cx="18" cy="64" rx="5" ry="3" fill="#f472b6" opacity="0.35" />
          <ellipse cx="82" cy="64" rx="5" ry="3" fill="#f472b6" opacity="0.35" />
          
          {/* Paws gripping the edge of the text box */}
          <circle cx="32" cy="90" r="9" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5"/>
          <circle cx="68" cy="90" r="9" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5"/>
          
          {/* Paw lines */}
          <path d="M 30 86 L 30 94 M 34 86 L 34 94" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 66 86 L 66 94 M 70 86 L 70 94" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  )
}
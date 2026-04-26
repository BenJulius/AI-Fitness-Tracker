"use client"
import { motion } from "framer-motion"

export default function Card({ title, value, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-panel p-5 flex flex-col items-start justify-center"
    >
      <h3 className="text-slate-400 text-sm font-medium tracking-wide mb-1 uppercase">{title}</h3>
      <p className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{value}</p>
    </motion.div>
  )
}
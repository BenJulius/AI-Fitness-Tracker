"use client"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

export default function Chart({ data }) {
  if (!data || data.length === 0) return (
    <div className="glass-panel h-64 flex items-center justify-center mt-6 text-slate-500">
      No data to chart yet.
    </div>
  )

  const chartData = data.map(w => ({
    name: new Date(w.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    volume: w.weight * w.reps
  })).slice(-10)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-panel h-72 w-full p-4 mt-6"
    >
      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide mb-4">Volume Over Time</h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
          />
          <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
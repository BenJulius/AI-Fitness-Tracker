"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusSquare, Zap, User, CalendarDays } from "lucide-react"

export default function BottomNav() {
  const path = usePathname()
  if (path === "/login" || path === "/onboarding") return null

  return (
    <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-6 z-50">
      <div className="glass-panel py-3 px-6 flex justify-between items-center rounded-full border-white/10">
        <Link href="/dashboard" className={`p-2 transition-colors ${path === "/dashboard" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"}`}>
          <Home size={24} />
        </Link>
        <Link href="/calendar" className={`p-2 transition-colors ${path === "/calendar" ? "text-orange-400" : "text-slate-500 hover:text-slate-300"}`}>
          <CalendarDays size={24} />
        </Link>
        <Link href="/log" className={`p-2 transition-colors ${path === "/log" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
          <PlusSquare size={24} />
        </Link>
        <Link href="/insights" className={`p-2 transition-colors ${path === "/insights" ? "text-purple-400" : "text-slate-500 hover:text-slate-300"}`}>
          <Zap size={24} />
        </Link>
        <Link href="/profile" className={`p-2 transition-colors ${path === "/profile" ? "text-pink-400" : "text-slate-500 hover:text-slate-300"}`}>
          <User size={24} />
        </Link>
      </div>
    </div>
  )
}
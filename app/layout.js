import "./globals.css"
import BottomNav from "../components/BottomNav"

export const metadata = {
  title: "FitAI Tracker",
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex justify-center bg-black">
        <div className="w-full max-w-md h-screen relative bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
          <main className="flex-1 overflow-y-auto pb-24 relative z-10">
            {children}
          </main>
          <BottomNav />
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl z-0 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl z-0 pointer-events-none" />
        </div>
      </body>
    </html>
  )
}
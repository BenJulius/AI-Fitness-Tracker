export default function PandaLogo({ className = "w-12 h-12" }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#0f172a" strokeWidth="4"/>
      <circle cx="30" cy="25" r="15" fill="#0f172a"/>
      <circle cx="70" cy="25" r="15" fill="#0f172a"/>
      <ellipse cx="35" cy="45" rx="10" ry="15" fill="#0f172a" transform="rotate(-15 35 45)"/>
      <ellipse cx="65" cy="45" rx="10" ry="15" fill="#0f172a" transform="rotate(15 65 45)"/>
      <circle cx="36" cy="42" r="3" fill="#ffffff"/>
      <circle cx="64" cy="42" r="3" fill="#ffffff"/>
      <ellipse cx="50" cy="65" rx="8" ry="5" fill="#0f172a"/>
      <path d="M 40 75 Q 50 85 60 75" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
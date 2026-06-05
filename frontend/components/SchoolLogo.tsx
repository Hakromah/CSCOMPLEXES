// Simple SVG logo component to use across pages


export function SchoolLogo({ className = 'h-12 w-12' }: { className?: string }) {
   return (
      <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
         <rect width="64" height="64" rx="8" fill="#1E40AF" />
         <path d="M16 40C20 32 28 28 32 28s12 4 16 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
         <path d="M20 20h24v6H20z" fill="#fff" />
         <text x="32" y="50" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">AMF</text>
      </svg>
   );
}

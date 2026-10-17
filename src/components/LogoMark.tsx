// شعار مرسى الجديد: أيقونة زجاجية بعمق ثلاثي الأبعاد (مرساة معدنية فوق موجتين).
export default function LogoMark({ className = 'w-24 h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="شعار مرسى">
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#127AAE" />
          <stop offset="0.55" stopColor="#093753" />
          <stop offset="1" stopColor="#041C2D" />
        </linearGradient>
        <linearGradient id="lm-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lm-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#DDEBF3" />
          <stop offset="1" stopColor="#94B6C9" />
        </linearGradient>
        <linearGradient id="lm-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFA24A" />
          <stop offset="1" stopColor="#FF5A0A" />
        </linearGradient>
        <radialGradient id="lm-glow" cx="0.8" cy="0.12" r="0.6">
          <stop offset="0" stopColor="#37C2F0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#37C2F0" stopOpacity="0" />
        </radialGradient>
        <filter id="lm-drop" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#021522" floodOpacity="0.6" />
        </filter>
        <clipPath id="lm-tile">
          <rect width="512" height="512" rx="116" />
        </clipPath>
      </defs>
      <g clipPath="url(#lm-tile)">
        <rect width="512" height="512" fill="url(#lm-bg)" />
        <rect width="512" height="512" fill="url(#lm-glow)" />
        <ellipse cx="256" cy="-50" rx="340" ry="260" fill="url(#lm-gloss)" />
        <path d="M0 404 C 80 372 160 432 256 404 S 430 372 512 404 V512 H0 Z" fill="#1B93C4" fillOpacity="0.85" />
        <g filter="url(#lm-drop)" fill="none" stroke="url(#lm-metal)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="256" cy="136" r="25" />
          <path d="M256 161 V376" />
          <path d="M204 208 H308" />
          <path d="M150 290 C 152 360 206 394 256 394 C 306 394 360 360 362 290" />
        </g>
        <g filter="url(#lm-drop)" fill="url(#lm-metal)">
          <polygon points="124,302 176,302 150,256" />
          <polygon points="336,302 388,302 362,256" />
        </g>
        <path d="M0 446 C 90 414 170 470 256 446 S 430 418 512 446 V512 H0 Z" fill="url(#lm-orange)" />
        <path d="M0 446 C 90 414 170 470 256 446 S 430 418 512 446" fill="none" stroke="#FFD2A6" strokeWidth="3" strokeOpacity="0.7" />
      </g>
      <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" />
    </svg>
  );
}

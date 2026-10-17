// شعار مرسى: مرساة داخل طوق نجاة برتقالي فوق موج البحر.
// لون المرساة يتبع لون النص الحالي (currentColor) فيظهر على الخلفيات الفاتحة والداكنة.
export default function Logo({ className = 'w-9 h-9' }: { className?: string }) {
  const clipId = 'marsa-logo-clip';
  return (
    <svg viewBox="124 124 776 776" className={className} role="img" aria-label="شعار مرسى" fill="none">
      <defs>
        <clipPath id={clipId}>
          <circle cx="512" cy="512" r="356" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d="M120 688 C 200 652 270 652 350 688 S 500 724 580 688 S 730 652 810 688 S 900 724 930 700 V 900 H 120 Z" fill="currentColor" fillOpacity="0.28" />
        <path d="M120 760 C 200 724 270 724 350 760 S 500 796 580 760 S 730 724 810 760 S 900 796 930 772 V 900 H 120 Z" fill="currentColor" fillOpacity="0.16" />
      </g>
      <circle cx="512" cy="512" r="372" stroke="#FF6D1B" strokeWidth="32" />
      <g stroke="currentColor" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="512" cy="272" r="46" />
        <path d="M512 318 V 744" />
        <path d="M432 392 H 592" />
        <path d="M340 536 C 356 676 448 764 512 764 C 576 764 668 676 684 536" />
      </g>
      <g fill="currentColor">
        <path d="M300 584 L 334 490 L 404 556 Z" />
        <path d="M724 584 L 690 490 L 620 556 Z" />
      </g>
    </svg>
  );
}

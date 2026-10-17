import LogoMark from './LogoMark';

export default function Splash() {
  return (
    <div className="splash-bg fixed inset-0 z-[100] flex flex-col items-center justify-center text-primary-foreground overflow-hidden" role="status" aria-label="جارٍ تشغيل مرسى">
      <LogoMark className="splash-pop w-36 h-36 drop-shadow-2xl" />
      <h1 className="splash-rise font-display font-extrabold text-5xl mt-7">مرسى</h1>
      <p className="splash-rise mt-2 text-primary-foreground/75 text-sm">سوق البحر الجزائري</p>
      <div className="absolute bottom-0 left-0 w-full h-36 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="wave-drift absolute bottom-0 left-0 h-full w-[200%] max-w-none">
          <path d="M0 80 C 120 40 240 120 360 80 S 600 40 720 80 S 960 120 1080 80 S 1320 40 1440 80 V160 H0 Z" fill="#FF6D1B" fillOpacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

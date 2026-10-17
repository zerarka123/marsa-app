import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  title: string;
  onBack?: () => void;
  children: ReactNode;
}

export default function Page({ title, onBack, children }: Props) {
  return (
    <div>
      <div className="safe-top sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="h-14 flex items-center gap-2 px-3">
          {onBack && (
            <button type="button" aria-label="رجوع" onClick={onBack} className="w-11 h-11 flex items-center justify-center rounded-full active:bg-secondary">
              <ArrowRight className="w-6 h-6" />
            </button>
          )}
          <h1 className={`font-display font-extrabold text-xl ${onBack ? '' : 'px-2'}`}>{title}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}

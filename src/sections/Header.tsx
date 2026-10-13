import { useEffect, useState } from 'react';
import { Anchor, BadgeCheck, Menu, Star, User, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFavorites } from '../lib/favorites';
import { goTo } from '../lib/nav';

const links = [
  { href: '#acheter', label: 'شراء' },
  { href: '#dalil', label: 'الدليل البحري' },
  { href: '#vendre', label: 'بِع قاربك' },
  { href: '#register', label: 'سجّل نشاطك' },
];

interface HeaderProps {
  onFavorites: () => void;
}

export default function Header({ onFavorites }: HeaderProps) {
  const fav = useFavorites();
  const { user, openAuth } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tone = scrolled || open ? 'text-foreground' : 'text-primary-foreground';

  return (
    <header
      className={`safe-top fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
        scrolled || open ? 'bg-background/95 backdrop-blur border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-2">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); goTo(''); }}
          className={`flex items-center gap-2 ${scrolled || open ? 'text-primary' : 'text-primary-foreground'}`}
        >
          <Anchor className="w-6 h-6" strokeWidth={2.2} />
          <span className="font-display text-2xl font-extrabold tracking-tight">مرسى</span>
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="الأقسام">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { e.preventDefault(); goTo(l.href.slice(1)); }}
              className={`link-underline text-sm font-medium transition-colors ${tone}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onFavorites}
            aria-label="المفضلة"
            className={`relative w-11 h-11 flex items-center justify-center ${scrolled ? 'text-primary' : 'text-primary-foreground'}`}
          >
            <Star className="w-5 h-5" />
            {fav.ids.length > 0 && (
              <span className="absolute top-1 end-1 bg-accent text-accent-foreground rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center">
                {fav.ids.length}
              </span>
            )}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => openAuth()}
              className="flex items-center gap-2 bg-card text-primary text-sm font-bold px-4 h-11 rounded-full border border-border"
            >
              <User className="w-4 h-4" /> حسابي
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="bg-accent text-accent-foreground text-sm font-bold px-4 h-11 rounded-full transition-transform hover:scale-105 active:scale-95"
            >
              افتح حسابك مجانا
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => goTo('sell-form', 88)}
          className="md:hidden ms-auto me-1 bg-accent text-accent-foreground text-xs font-bold px-3 h-11 rounded-full active:scale-95"
        >
          انشر إعلانك
        </button>
        <button
          type="button"
          className={`md:hidden w-11 h-11 flex items-center justify-center ${tone}`}
          onClick={() => setOpen(!open)}
          aria-label="القائمة"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border px-5 py-4 space-y-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { e.preventDefault(); setOpen(false); goTo(l.href.slice(1)); }}
              className="block text-foreground font-medium py-3"
            >
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => { setOpen(false); openAuth(user ? undefined : 'signup'); }}
            className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground text-center font-bold px-4 h-12 rounded-full mt-2"
          >
            {user ? <User className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            {user ? 'حسابي' : 'افتح حسابك مجانا'}
          </button>
        </div>
      )}
    </header>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Search, MapPin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { wilayas } from '../data';

interface HeroProps {
  onSearch: (query: string, wilaya: string) => void;
}

const tabs = [
  { id: 'acheter', label: 'شراء' },
  { id: 'dalil', label: 'الدليل' },
] as const;

export default function Hero({ onSearch }: HeroProps) {
  const { user, openAuth } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('acheter');
  const [query, setQuery] = useState('');
  const [wilaya, setWilaya] = useState('الكل');

  const submit = () => {
    if (tab === 'acheter' || tab === 'dalil') {
      onSearch(query, wilaya);
    }
    document.getElementById(tab)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden bg-primary">
      {/* صورة الميناء */}
      <div className="absolute inset-0">
        <img
          src={`${import.meta.env.BASE_URL}img/hero.webp`}
          alt="ميناء صيد جزائري"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-primary/10" />
      </div>

      {/* شريط موجي متحرك */}
      <div className="absolute bottom-0 inset-x-0 h-10 overflow-hidden opacity-30 pointer-events-none">
        <svg className="wave-drift w-[200%] h-full" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0,30 C120,50 240,10 360,30 C480,50 600,10 720,30 C840,50 960,10 1080,30 C1200,50 1320,10 1440,30 L1440,60 L0,60 Z"
            fill="#F3F1E6"
          />
          <path
            d="M720,30 C840,50 960,10 1080,30 C1200,50 1320,10 1440,30 C1560,50 1680,10 1800,30 C1920,50 2040,10 2160,30 L2160,60 L720,60 Z"
            fill="#F3F1E6"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pb-24 pt-40 w-full">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-accent font-bold text-sm md:text-base tracking-wide mb-4"
        >
          السوق البحري الجزائري
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display font-extrabold text-primary-foreground leading-[1.15] text-4xl md:text-6xl lg:text-7xl max-w-3xl"
        >
          قاربك القادم
          <br />
          <span className="text-accent">يرسو هنا.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-primary-foreground/80 text-base md:text-lg mt-5 max-w-xl leading-relaxed"
        >
          بيع وشراء قوارب الصيد والنزهة والمعدات البحرية، ودليل للورشات ومحلات قطع الغيار —
          من تلمسان إلى الطارف.
        </motion.p>

        {/* لوحة البحث */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-8 bg-card rounded-2xl p-2 shadow-2xl max-w-2xl"
        >
          <div className="flex gap-1 border-b border-border px-2 pt-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 h-11 text-sm font-bold rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'text-primary border-b-2 border-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 p-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                aria-label="بحث"
                placeholder="ابحث: قارب صيد، ياماها، ورشة…"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 sm:border-s border-border">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                aria-label="الولاية"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="bg-transparent outline-none text-sm text-foreground cursor-pointer"
              >
                {wilayas.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={submit}
              className="bg-primary text-primary-foreground font-bold text-sm px-6 h-12 rounded-xl transition-transform hover:scale-[1.03] active:scale-95"
            >
              ابحث
            </button>
          </div>
        </motion.div>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-5"
          >
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-display font-extrabold text-base px-7 h-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <BadgeCheck className="w-5 h-5" /> افتح حسابك مجانا
            </button>
          </motion.div>
        )}

        {/* أرقام */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex gap-8 md:gap-14 mt-10 text-primary-foreground"
        >
          {[
            { n: '14', t: 'ولاية ساحلية' },
          ].map((s) => (
            <div key={s.t}>
              <div className="font-display font-extrabold text-2xl md:text-3xl">{s.n}</div>
              <div className="text-primary-foreground/70 text-xs md:text-sm mt-1">{s.t}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

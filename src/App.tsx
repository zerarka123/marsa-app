import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Splash from './components/Splash';
import AuthScreen from './components/AuthScreen';
import TabBar from './components/TabBar';
import Page from './components/Page';
import BoatDialog from './components/BoatDialog';
import Marketplace from './sections/Marketplace';
import Directory from './sections/Directory';
import Register from './sections/Register';
import Sell from './sections/Sell';
import Home from './screens/Home';
import Favorites from './screens/Favorites';
import Account from './screens/Account';
import MyListings from './screens/MyListings';
import { FavoritesProvider } from './lib/favorites';
import { RemoteProvider } from './lib/remote';
import { AuthProvider, useAuth } from './lib/auth';
import { UiProvider } from './lib/ui';
import { isScreen, isTab, type Screen, type Tab } from './lib/screens';
import type { Boat, BoatCategory } from './data';

function Shell() {
  const [screen, setScreen] = useState<Screen>('home');
  const [from, setFrom] = useState<Tab>('home'); // التبويب الذي فُتحت منه الصفحة الفرعية
  const [query, setQuery] = useState('');
  const [wilaya, setWilaya] = useState('الكل');
  const [dirWilaya, setDirWilaya] = useState('الكل');
  const [category, setCategory] = useState<BoatCategory | 'الكل'>('الكل');
  const [selected, setSelected] = useState<Boat | null>(null);

  const go = (next: Screen) => {
    if (!isTab(next) && isTab(screen)) setFrom(screen);
    setScreen(next);
  };
  const back = () => setScreen(from);

  // تنقل من داخل الأقسام (marsa:go) وزر الرجوع في أندرويد (marsa:back)
  useEffect(() => {
    const onGo = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail;
      if (!isScreen(d)) return;
      if (!isTab(d) && isTab(screen)) setFrom(screen);
      setScreen(d);
    };
    const onBack = (e: Event) => {
      if (screen === 'home') return;
      e.preventDefault();
      setScreen(isTab(screen) ? 'home' : from);
    };
    window.addEventListener('marsa:go', onGo);
    window.addEventListener('marsa:back', onBack);
    return () => {
      window.removeEventListener('marsa:go', onGo);
      window.removeEventListener('marsa:back', onBack);
    };
  }, [screen, from]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <>
      <div className="min-h-screen max-w-5xl mx-auto bg-background pb-4 md:pb-24">
        {screen === 'home' && (
          <Home
            onSearch={(q) => { setQuery(q); setCategory('الكل'); setScreen('browse'); }}
            onCategory={(c) => { setCategory(c); setQuery(''); setScreen('browse'); }}
            onOpen={setSelected}
            go={go}
          />
        )}

        {screen === 'browse' && (
          <Page title="تصفح الإعلانات">
            <div className="px-5 pt-3">
              <label className="relative block">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث: اسم القارب، المحرك، الولاية…"
                  aria-label="بحث"
                  className="w-full py-3.5 ps-12 pe-4 rounded-2xl bg-card border border-border text-base outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
            <div className="embedded">
              <Marketplace
                query={query}
                wilaya={wilaya}
                setWilaya={setWilaya}
                category={category}
                setCategory={setCategory}
                onOpen={setSelected}
                clearQuery={() => setQuery('')}
              />
            </div>
          </Page>
        )}

        {screen === 'sell' && (
          <Page title="بِع قاربك">
            <div className="embedded"><Sell /></div>
          </Page>
        )}

        {screen === 'favs' && <Favorites onOpen={setSelected} onBrowse={() => setScreen('browse')} />}
        {screen === 'account' && <Account go={go} />}

        {screen === 'dalil' && (
          <Page title="الدليل البحري" onBack={back}>
            <div className="embedded"><Directory query="" wilaya={dirWilaya} setWilaya={setDirWilaya} /></div>
          </Page>
        )}

        {screen === 'register' && (
          <Page title="سجّل نشاطك" onBack={back}>
            <div className="embedded"><Register /></div>
          </Page>
        )}

        {screen === 'mine' && <MyListings onBack={back} onOpen={setSelected} onSell={() => setScreen('sell')} />}
      </div>

      <TabBar tab={isTab(screen) ? screen : from} onTab={setScreen} />
      <BoatDialog boat={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Root() {
  const { user } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    document.body.classList.add('loaded');
    const t = window.setTimeout(() => setSplash(false), 1900);
    return () => window.clearTimeout(t);
  }, []);

  if (splash) return <Splash />;
  return user ? <Shell /> : <AuthScreen />;
}

export default function App() {
  return (
    <UiProvider>
      <AuthProvider>
        <RemoteProvider>
          <FavoritesProvider>
            <Root />
          </FavoritesProvider>
        </RemoteProvider>
      </AuthProvider>
    </UiProvider>
  );
}

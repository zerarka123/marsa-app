import { useEffect, useState } from 'react';
import Header from './sections/Header';
import Hero from './sections/Hero';
import CategoryGrid from './sections/CategoryGrid';
import Marketplace from './sections/Marketplace';
import Directory from './sections/Directory';
import Register from './sections/Register';
import Sell from './sections/Sell';
import Footer from './sections/Footer';
import BottomNav from './sections/BottomNav';
import BoatDialog from './components/BoatDialog';
import FavoritesDialog from './components/FavoritesDialog';
import { FavoritesProvider } from './lib/favorites';
import { RemoteProvider } from './lib/remote';
import { AuthProvider } from './lib/auth';
import { UiProvider } from './lib/ui';
import type { Boat, BoatCategory } from './data';

export default function App() {
  const [query, setQuery] = useState('');
  const [wilaya, setWilaya] = useState('الكل');
  const [category, setCategory] = useState<BoatCategory | 'الكل'>('الكل');
  const [selected, setSelected] = useState<Boat | null>(null);
  const [favOpen, setFavOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('loaded');
  }, []);

  return (
    <UiProvider>
      <AuthProvider>
        <RemoteProvider>
          <FavoritesProvider>
            <div className="min-h-screen">
              <Header onFavorites={() => setFavOpen(true)} />
              <main>
                <Hero onSearch={(q, w) => { setQuery(q); setWilaya(w); }} />
                <CategoryGrid onPick={setCategory} />
                <Marketplace
                  query={query}
                  wilaya={wilaya}
                  setWilaya={setWilaya}
                  category={category}
                  setCategory={setCategory}
                  onOpen={setSelected}
                  clearQuery={() => setQuery('')}
                />
                <Directory query={query} wilaya={wilaya} setWilaya={setWilaya} />
                <Register />
                <Sell />
              </main>
              <Footer />
              <BottomNav onFavorites={() => setFavOpen(true)} />
              <BoatDialog boat={selected} onClose={() => setSelected(null)} />
              <FavoritesDialog open={favOpen} onClose={() => setFavOpen(false)} onOpenBoat={setSelected} />
            </div>
          </FavoritesProvider>
        </RemoteProvider>
      </AuthProvider>
    </UiProvider>
  );
}

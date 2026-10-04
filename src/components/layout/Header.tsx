import { useEffect } from 'react';
import { Moon, Search, ShoppingBag, Sun } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatPts } from '@/lib/utils';
import { NavLinks } from './NavBar';

/** Logo oficial (blanco); se invierte en modo claro. */
export function Logo({ className }: { className?: string }) {
  return <img src="/img/paseo-logo.png" alt="Paseo Aranjuez" className={`h-7 w-auto ${className ?? ''}`} />;
}

/** Barra global fina y translúcida, como la de apple.com. */
export function Header() {
  const { currentUser, currentStore, darkMode, toggleDarkMode, cartCount, setCartOpen, setTab, setPaletteOpen } = useApp();
  const isClient = currentUser.role === 'client';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  const iconBtn = 'flex h-9 w-9 items-center justify-center text-foreground/75 transition hover:text-foreground';

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-[1024px] items-center gap-4 px-4 sm:px-6">
        <button onClick={() => setTab(isClient ? 'home' : 'm-home')} className="flex items-center gap-3" aria-label="Inicio">
          <Logo />
          {!isClient && <span className="hidden border-l border-border pl-3 text-[13px] text-muted-foreground sm:block">{currentStore?.name}</span>}
        </button>

        <NavLinks className="mx-auto hidden md:flex" />

        <div className="ml-auto flex items-center md:ml-0">
          {isClient && (
            <button onClick={() => setTab('points')} className="mr-2 text-[13px] text-foreground/75 transition hover:text-foreground tabular">
              {formatPts(currentUser.pointsBalance)} pts
            </button>
          )}
          <button className={iconBtn} onClick={() => setPaletteOpen(true)} aria-label="Buscar">
            <Search size={17} strokeWidth={1.8} />
          </button>
          {isClient && (
            <button className={`${iconBtn} relative`} onClick={() => setCartOpen(true)} aria-label="Bolsa">
              <ShoppingBag size={17} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute bottom-1 right-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          <button className={iconBtn} onClick={toggleDarkMode} aria-label="Cambiar tema">
            {darkMode ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
          </button>
        </div>
      </div>
    </header>
  );
}

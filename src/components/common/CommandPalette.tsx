import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { cn, formatBs } from '@/lib/utils';
import { StoreLogo } from '@/components/ui/photo';
import { ProductVisual } from '@/modules/paseoya/ProductVisual';
import { CLIENT_NAV, MERCHANT_NAV } from '@/components/layout/NavBar';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

type Result =
  | { kind: 'jarvis'; id: string; label: string; run: () => void }
  | { kind: 'product'; id: string; label: string; hint: string; productId: string; run: () => void }
  | { kind: 'store'; id: string; label: string; hint: string; logo: string | null; run: () => void }
  | { kind: 'link'; id: string; label: string; run: () => void };

/** Búsqueda global al estilo del buscador de apple.com: accesos rápidos y resultados instantáneos. */
export function CommandPalette() {
  const app = useApp();
  const { paletteOpen, setPaletteOpen, state, currentUser } = app;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const isClient = currentUser.role === 'client';

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setActive(0);
    }
  }, [paletteOpen]);

  const q = norm(query.trim());

  const results = useMemo<Result[]>(() => {
    const close = () => setPaletteOpen(false);
    const out: Result[] = [];
    if (!q) {
      (isClient ? CLIENT_NAV : MERCHANT_NAV).forEach((n) =>
        out.push({ kind: 'link', id: n.tab, label: n.label, run: () => (close(), app.setTab(n.tab)) }),
      );
      return out;
    }
    if (isClient) {
      out.push({ kind: 'jarvis', id: 'jarvis', label: `Preguntar a Jarvis: “${query.trim()}”`, run: () => app.askJarvis(query.trim()) });
      state.products
        .filter((p) => norm(`${p.name} ${p.description} ${p.category} ${state.stores.find((s) => s.id === p.storeId)?.name}`).includes(q))
        .slice(0, 4)
        .forEach((p) =>
          out.push({
            kind: 'product',
            id: `p-${p.id}`,
            label: p.name,
            hint: formatBs(p.price),
            productId: p.id,
            run: () => (close(), app.openProduct(p.id)),
          }),
        );
    }
    DIRECTORY.filter((s) => norm(`${s.name} ${s.categories.join(' ')} ${floorLabel(s.floor)}`).includes(q))
      .slice(0, 6)
      .forEach((s) =>
        out.push({ kind: 'store', id: `s-${s.id}`, label: s.name, hint: floorLabel(s.floor), logo: s.logo, run: () => app.openStore(s.id) }),
      );
    return out;
  }, [q, query, isClient, state, app, setPaletteOpen]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === 'Escape') setPaletteOpen(false);
  };

  const section = (r: Result, i: number) => {
    const prev = results[i - 1];
    const group = r.kind === 'product' ? 'Productos' : r.kind === 'store' ? 'Tiendas' : r.kind === 'link' ? 'Accesos rápidos' : null;
    const prevGroup = prev ? (prev.kind === 'product' ? 'Productos' : prev.kind === 'store' ? 'Tiendas' : prev.kind === 'link' ? 'Accesos rápidos' : null) : null;
    return group && group !== prevGroup ? group : null;
  };

  return createPortal(
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-[55]" onKeyDown={onKeyDown}>
          <motion.div className="absolute inset-0 bg-black/25 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPaletteOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative bg-background shadow-lift"
          >
            <div className="mx-auto max-w-[680px] px-6 pb-8 pt-10">
              <div className="flex items-center gap-3">
                <Search size={22} className="text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isClient ? 'Buscar en Paseo Aranjuez' : 'Buscar tiendas'}
                  className="h-12 flex-1 bg-transparent font-display text-[24px] font-semibold tracking-tight outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <div ref={listRef} className="mt-4 max-h-[60vh] overflow-y-auto">
                {q && results.length <= (isClient ? 1 : 0) && <p className="py-6 text-[15px] text-muted-foreground">No hay resultados para “{query}”.</p>}
                {results.map((r, i) => {
                  const header = section(r, i);
                  return (
                    <div key={r.id}>
                      {header && <p className="caption mb-1 mt-5">{header}</p>}
                      <button
                        data-idx={i}
                        onMouseMove={() => setActive(i)}
                        onClick={r.run}
                        className={cn('flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px]', i === active && 'bg-surface')}
                      >
                        {r.kind === 'product' && <ProductVisual product={state.products.find((p) => p.id === r.productId)!} className="h-9 w-9 rounded-lg" />}
                        {r.kind === 'store' && <StoreLogo src={r.logo} name={r.label} className="h-9 w-9" />}
                        {(r.kind === 'link' || r.kind === 'jarvis') && <ArrowRight size={15} className="mx-1 text-muted-foreground" />}
                        <span className={cn('min-w-0 flex-1 truncate', r.kind === 'jarvis' && 'text-link')}>{r.label}</span>
                        {'hint' in r && <span className="text-[13px] text-muted-foreground">{r.hint}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

import { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY, DIRECTORY_GROUPS, groupOf } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { cn, formatBs, formatPts } from '@/lib/utils';
import { Photo, StoreLogo } from '@/components/ui/photo';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { ProductVisual } from './ProductVisual';
import { ProductDetailModal } from './ProductDetailModal';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const FLOORS = [-1, 0, 1, 2, 3, 4];

/** Tienda PaseoYa — estructura de apple.com/la/store. */
export function MarketplaceView() {
  const { state, addToCart, getStore, focusedProductId, openProduct, openStore, askJarvis } = useApp();
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todas');
  const [floor, setFloor] = useState(-1);

  const products = useMemo(() => {
    const q = norm(query.trim());
    return state.products.filter((p) => {
      const st = state.stores.find((s) => s.id === p.storeId);
      return (!storeFilter || p.storeId === storeFilter) && (!q || norm(`${p.name} ${p.description} ${st?.name} ${p.category}`).includes(q));
    });
  }, [state.products, state.stores, storeFilter, query]);

  const directory = useMemo(
    () => DIRECTORY.filter((s) => (group === 'Todas' || groupOf(s) === group) && (floor === -1 || s.floor === floor)),
    [group, floor],
  );

  const focused = state.products.find((p) => p.id === focusedProductId) ?? null;

  return (
    <div className="pb-20">
      {/* Encabezado */}
      <section className="wrap flex flex-col gap-6 pt-12 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="headline max-w-xl">
          Tienda. <span className="text-muted-foreground">Compra en línea y retira hoy en el Paseo.</span>
        </h1>
        <div className="text-[14px] sm:text-right">
          <p className="font-semibold">¿Necesitas ayuda para elegir?</p>
          <button className="link" onClick={() => askJarvis('¿Qué me recomiendas comprar hoy?')}>
            Pregúntale a Jarvis <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* Tiendas con retiro (logos, como la fila de categorías de Apple Store) */}
      <section className="no-scrollbar mt-10 flex gap-8 overflow-x-auto px-4 sm:justify-center sm:px-6">
        {state.stores.map((s) => (
          <button key={s.id} onClick={() => setStoreFilter(storeFilter === s.id ? null : s.id)} className="flex w-20 shrink-0 flex-col items-center gap-2">
            <StoreLogo src={s.logoUrl} name={s.name} className={cn('h-14 w-14 transition', storeFilter && storeFilter !== s.id && 'opacity-40')} />
            <span className={cn('text-center text-[12px] leading-tight', storeFilter === s.id ? 'font-semibold' : '')}>{s.name}</span>
          </button>
        ))}
      </section>

      {/* Productos */}
      <section className="mt-14">
        <div className="wrap flex flex-wrap items-end justify-between gap-4">
          <h2 className="title-2">
            {storeFilter ? getStore(storeFilter)?.name : 'Lo más pedido.'}{' '}
            <span className="text-muted-foreground">{storeFilter ? 'Disponible para retiro hoy.' : 'Listo para retirar hoy.'}</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar productos" className="input h-9 rounded-full bg-surface pl-9 text-[14px]" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Limpiar">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="wrap py-10 text-[17px] text-muted-foreground">
            No encontramos productos para “{query}”.{' '}
            <button className="link" onClick={() => askJarvis(query)}>
              Preguntar a Jarvis <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-8 sm:px-[max(1.5rem,calc((100vw-1024px)/2+1.5rem))]">
            {products.map((p) => {
              const st = getStore(p.storeId);
              return (
                <article key={p.id} className="tile flex w-[290px] shrink-0 snap-start flex-col shadow-tile transition hover:shadow-lift sm:w-[320px]">
                  <button onClick={() => openProduct(p.id)} className="px-6 pt-6 text-left">
                    <p className="caption">
                      {st?.name} · {st && floorLabel(st.floor)}
                    </p>
                    <p className="mt-1 text-[21px] font-semibold leading-tight">{p.name}</p>
                    <p className="mt-1 text-[15px] text-muted-foreground">
                      {formatBs(p.price)} · {formatPts(p.pointsReward)} PaseoPoints
                    </p>
                  </button>
                  <button onClick={() => openProduct(p.id)} className="mt-4 block overflow-hidden">
                    <ProductVisual product={p} className="aspect-[4/3] w-full transition duration-500 hover:scale-[1.02]" />
                  </button>
                  <div className="flex items-center justify-between px-6 py-4">
                    <button className="link text-[15px]" onClick={() => openProduct(p.id)}>
                      Más información <ChevronRight size={14} />
                    </button>
                    <Button size="sm" onClick={() => addToCart(p.id)} disabled={p.stock === 0}>
                      Agregar
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Directorio real */}
      <section className="wrap mt-12">
        <h2 className="title-2">
          Directorio. <span className="text-muted-foreground">Todas las tiendas del Paseo.</span>
        </h2>
        <Segmented className="mt-6" value={group} onChange={setGroup} options={DIRECTORY_GROUPS.map((g) => ({ value: g, label: g }))} />
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {FLOORS.map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition', floor === f ? 'bg-foreground text-background' : 'bg-surface text-foreground hover:bg-muted-foreground/15')}
            >
              {f === -1 ? 'Todos los pisos' : floorLabel(f)}
            </button>
          ))}
        </div>
        <p className="caption mt-4">{directory.length} tiendas</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {directory.map((s) => (
            <button key={s.id} onClick={() => openStore(s.id)} className="group text-left">
              <div className="overflow-hidden rounded-tile">
                <Photo src={s.image} alt={s.name} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <p className="mt-2.5 text-[15px] font-semibold leading-tight">{s.name}</p>
              <p className="text-[13px] text-muted-foreground">
                {floorLabel(s.floor)} · {groupOf(s)}
              </p>
            </button>
          ))}
        </div>
      </section>

      <ProductDetailModal product={focused} onClose={() => openProduct(null)} />
    </div>
  );
}

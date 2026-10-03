import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY, groupOf } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { formatPts } from '@/lib/utils';
import { Photo } from '@/components/ui/photo';

/** Tiendas reales con buena fotografía para el carrusel del inicio. */
const APPLE_LAND_ID = DIRECTORY.find((s) => s.slug === 'apple-land')?.id ?? null;

const FEATURED = ['apple-land', 'cinnabon', 'puma', 'monalisa-bier-haus', 'fossil', 'crocs', 'cayenna', 'acai-golden', 'kosi-jeans', 'game-shop', 'patanegra-cocina-espanola', 'tigo'];

function Tile({ title, text, links, image, position, dark, onClick }: { title: string; text: string; links: ReactNode; image: string; position?: string; dark?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`tile-surface flex min-h-[460px] cursor-pointer flex-col text-center sm:min-h-[520px] ${dark ? 'bg-black text-white' : ''}`}>
      <div className="relative z-10 px-6 pt-10">
        <h3 className="title-1">{title}</h3>
        <p className={`mt-1.5 text-[19px] ${dark ? 'text-white/75' : 'text-muted-foreground'}`}>{text}</p>
        <div className="mt-3 flex justify-center gap-6 text-[17px]">{links}</div>
      </div>
      <Photo src={image} alt={title} position={position} className="mt-auto h-64 w-full sm:h-72" />
    </div>
  );
}

const More = ({ children, onClick, light }: { children: ReactNode; onClick: () => void; light?: boolean }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`inline-flex items-center gap-0.5 hover:underline ${light ? 'text-emerald-300' : 'text-link'}`}
  >
    {children} <ChevronRight size={16} />
  </button>
);

/** Inicio — estructura de apple.com: héroe, mosaicos 2×2 y carrusel de tiendas. */
export function ClientHome() {
  const { state, currentUser, setTab, askJarvis, openStore, getStore } = useApp();
  const nextOrder = state.orders.find((o) => o.userId === currentUser.id && o.status === 'Listo para recoger');
  const nextStore = nextOrder ? getStore(nextOrder.storeId) : undefined;
  const featured = FEATURED.map((slug) => DIRECTORY.find((s) => s.slug === slug)).filter(Boolean) as typeof DIRECTORY;

  return (
    <div className="space-y-3 pb-16">
      {nextOrder && (
        <div className="bg-surface py-3 text-center text-[14px]">
          Tu pedido en {nextOrder.storeName} está listo para retirar en {nextStore && floorLabel(nextStore.floor)}. PIN{' '}
          <span className="font-semibold tabular">{nextOrder.pickupPin}</span>.{' '}
          <button className="link" onClick={() => setTab('orders')}>
            Ver pedido <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Héroe */}
      <section className="text-center">
        <div className="wrap pb-8 pt-12">
          <h1 className="headline">Paseo Aranjuez</h1>
          <p className="subhead mt-2">Compra en línea. Retira en tienda. Gana PaseoPoints.</p>
          <div className="mt-4 flex justify-center gap-6 text-[17px]">
            <More onClick={() => setTab('paseoya')}>Ir a la tienda</More>
            <More onClick={() => setTab('points')}>Ver mis puntos</More>
          </div>
        </div>
        <Photo src="/img/paseo-edificio.jpg" alt="Edificio Paseo Aranjuez, Cochabamba" position="50% 40%" eager className="h-[340px] w-full sm:h-[520px]" />
      </section>

      {/* Mosaicos */}
      <section className="grid gap-3 px-3 md:grid-cols-2">
        <Tile
          title="PaseoPoints"
          text={`Tienes ${formatPts(currentUser.pointsBalance)} puntos para canjear.`}
          image="/img/stores/helados-vacafria/g1.webp"
          position="50% 30%"
          onClick={() => setTab('points')}
          links={<More onClick={() => setTab('points')}>Ver beneficios</More>}
        />
        <Tile
          title="Jarvis"
          text="Pregunta qué comer, dónde comprar o cómo llegar."
          image="/img/stores/churros-calientes/cover.jpeg"
          dark
          onClick={() => setTab('jarvis')}
          links={
            <>
              <More light onClick={() => setTab('jarvis')}>Preguntar</More>
              <More light onClick={() => askJarvis('Quiero unos audífonos y luego tomarme un café')}>Probar un ejemplo</More>
            </>
          }
        />
        <Tile
          title="Pide y retira"
          text="Sin filas ni envíos. Tu pedido te espera en el local."
          image="/img/stores/churros-calientes/g4.webp"
          position="50% 60%"
          onClick={() => setTab('paseoya')}
          links={<More onClick={() => setTab('paseoya')}>Ver productos</More>}
        />
        <Tile
          title="Apple Land"
          text="Tecnología en el Segundo Piso."
          image="/img/stores/apple-land/cover.webp"
          onClick={() => openStore(APPLE_LAND_ID)}
          links={<More onClick={() => openStore(APPLE_LAND_ID)}>Ver tienda</More>}
        />
      </section>

      {/* Carrusel de tiendas */}
      <section className="pt-14">
        <div className="wrap flex items-end justify-between gap-4">
          <h2 className="title-1">
            Tiendas. <span className="text-muted-foreground">{DIRECTORY.length} locales en cinco pisos.</span>
          </h2>
          <button className="link hidden shrink-0 text-[17px] sm:inline-flex" onClick={() => setTab('paseoya')}>
            Ver directorio <ChevronRight size={16} />
          </button>
        </div>
        <div className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto scroll-px-6 px-4 pb-6 sm:px-[max(1.5rem,calc((100vw-1024px)/2+1.5rem))]">
          {featured.map((s) => (
            <button key={s.id} onClick={() => openStore(s.id)} className="tile w-[280px] shrink-0 snap-start text-left shadow-tile transition hover:shadow-lift sm:w-[320px]">
              <div className="px-6 pb-4 pt-6">
                <p className="caption">{floorLabel(s.floor)}</p>
                <p className="mt-1 text-[21px] font-semibold leading-tight">{s.name}</p>
                <p className="mt-1 text-[15px] text-muted-foreground">{groupOf(s)}</p>
              </div>
              <Photo src={s.image} alt={s.name} className="aspect-[4/3] w-full" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Coins } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY, groupOf } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { formatPts } from '@/lib/utils';
import { Photo } from '@/components/ui/photo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const FEATURED = [
  'apple-land',
  'cinnabon',
  'puma',
  'monalisa-bier-haus',
  'fossil',
  'crocs',
  'cayenna',
  'acai-golden',
  'kosi-jeans',
  'game-shop',
  'patanegra-cocina-espanola',
  'tigo',
];

export function ClientHome() {
  const { state, currentUser, setTab, openStore, getStore } = useApp();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const nextOrder = state.orders.find((o) => o.userId === currentUser.id && o.status === 'Listo para recoger');
  const nextStore = nextOrder ? getStore(nextOrder.storeId) : undefined;
  const featured = FEATURED.map((slug) => DIRECTORY.find((s) => s.slug === slug)).filter(Boolean) as typeof DIRECTORY;

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Autoplay con pausa en hover / interacción para accesibilidad y usabilidad
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="space-y-8 pb-16">
      {/* Banner de orden pendiente */}
      {nextOrder && (
        <div className="wrap pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-[14px]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>
                Tu pedido en <strong>{nextOrder.storeName}</strong> está listo para retirar en{' '}
                {nextStore && floorLabel(nextStore.floor)}. PIN:{' '}
                <span className="font-mono font-semibold tabular">{nextOrder.pickupPin}</span>
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setTab('orders')}>
              Ver pedido <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Héroe con imagen del paseo de fondo */}
      <section className="wrap pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-[#07012F] px-6 py-16 sm:px-12 sm:py-24 text-center shadow-2xl">
          {/* Imagen de fondo con opacidad y gradientes protectores */}
          <div className="absolute inset-0 z-0">
            <img
              src="/img/paseo-edificio.jpg"
              alt="Edificio Paseo Aranjuez"
              className="h-full w-full object-cover object-[50%_35%] opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07012F] via-[#07012F]/65 to-[#07012F]/25" />
          </div>

          {/* Contenido en primer plano */}
          <div className="relative z-10 mx-auto max-w-2xl space-y-4">
            <div className="flex justify-center">
              <Badge variant="subtle" className="text-xs tracking-wider uppercase">
                SuperApp Paseo Aranjuez
              </Badge>
            </div>
            <h1 className="headline text-4xl sm:text-5xl text-foreground font-bold tracking-tight">
              Paseo Aranjuez
            </h1>
            <p className="subhead text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Compra en línea, retira en tienda y acumula PaseoPoints en tus locales favoritos de Cochabamba.
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <Button size="md" onClick={() => setTab('paseoya')} className="shadow-lg">
                Ir a la tienda
              </Button>
              <Button size="md" variant="secondary" onClick={() => setTab('points')}>
                Ver mis puntos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Clave (Sin redundancias: PaseoPoints + Jarvis) */}
      <section className="wrap">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card: PaseoPoints */}
          <Card
            onClick={() => setTab('points')}
            className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-all hover:border-foreground/30 hover:shadow-lg"
          >
            <div className="relative h-44 overflow-hidden bg-muted">
              <Photo
                src="/img/stores/helados-vacafria/g1.webp"
                alt="PaseoPoints"
                position="50% 30%"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-md">
                  <Coins size={13} className="text-amber-400" /> Beneficios
                </span>
              </div>
            </div>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                PaseoPoints
                <span className="text-xs font-semibold text-white tabular">
                  {formatPts(currentUser.pointsBalance)} pts
                </span>
              </CardTitle>
              <CardDescription>
                Acumula puntos por tus consumos y canjéalos por beneficios directos en el mall.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-white hover:bg-transparent">
                Ver beneficios <ChevronRight size={14} />
              </Button>
            </CardFooter>
          </Card>

          {/* Card: Jarvis AI */}
          <Card
            onClick={() => setTab('jarvis')}
            className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-all hover:border-foreground/30 hover:shadow-lg"
          >
            <div className="relative h-44 overflow-hidden bg-muted">
              <Photo
                src="/img/stores/churros-calientes/cover.jpeg"
                alt="Jarvis"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-md">
                  <Sparkles size={13} className="text-white" /> Asistente IA
                </span>
              </div>
            </div>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-lg">Jarvis Concierge</CardTitle>
              <CardDescription>
                Pregúntale qué almorzar hoy, dónde encontrar una tienda o la mejor ruta en el centro.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-0">
              <Button variant="ghost" size="sm" className="px-0 text-primary hover:bg-transparent">
                Preguntarle a Jarvis <ChevronRight size={14} />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Carrusel Interactivo de Tiendas Destacadas */}
      <section className="wrap pt-2">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="title-2 text-xl sm:text-2xl font-semibold">Tiendas Destacadas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Explora los locales más concurridos del Paseo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollCarousel('left')}
              aria-label="Anterior"
              className="rounded-full"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollCarousel('right')}
              aria-label="Siguiente"
              className="rounded-full"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 scroll-smooth"
        >
          {featured.map((s) => (
            <Card
              key={s.id}
              onClick={() => openStore(s.id)}
              className="w-[240px] shrink-0 snap-start cursor-pointer overflow-hidden border-border/60 bg-card transition-all hover:border-foreground/30 hover:shadow-lg sm:w-[260px]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <Photo
                  src={s.image}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{floorLabel(s.floor)}</span>
                  <span className="truncate max-w-[120px]">{groupOf(s)}</span>
                </div>
                <CardTitle className="text-base truncate mt-1">{s.name}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

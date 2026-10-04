import { useMemo, useState, useEffect } from 'react';
import { ChevronRight, Search, Sparkles, X, Plus, Store as StoreIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY, DIRECTORY_GROUPS, groupOf } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { cn, formatBs, formatPts } from '@/lib/utils';
import { Photo, StoreLogo } from '@/components/ui/photo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ProductVisual } from './ProductVisual';
import { ProductDetailModal } from './ProductDetailModal';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const FLOORS = [-1, 0, 1, 2, 3, 4];
const PRODUCTS_PER_PAGE = 8;
const STORES_PER_PAGE = 8;

export function MarketplaceView() {
  const { state, addToCart, getStore, focusedProductId, openProduct, openStore, askJarvis } = useApp();
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [productPage, setProductPage] = useState(1);

  // Filtros y búsqueda para el directorio de tiendas
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [group, setGroup] = useState('Todas');
  const [floor, setFloor] = useState(-1);
  const [storePage, setStorePage] = useState(1);

  // Reset de página al cambiar filtros de producto
  useEffect(() => {
    setProductPage(1);
  }, [storeFilter, productQuery]);

  // Reset de página al cambiar filtros de tienda
  useEffect(() => {
    setStorePage(1);
  }, [storeSearchQuery, group, floor]);

  const filteredProducts = useMemo(() => {
    const q = norm(productQuery.trim());
    return state.products.filter((p) => {
      const st = state.stores.find((s) => s.id === p.storeId);
      return (
        (!storeFilter || p.storeId === storeFilter) &&
        (!q || norm(`${p.name} ${p.description} ${st?.name} ${p.category}`).includes(q))
      );
    });
  }, [state.products, state.stores, storeFilter, productQuery]);

  const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, productPage]);

  const filteredDirectory = useMemo(() => {
    const q = norm(storeSearchQuery.trim());
    return DIRECTORY.filter((s) => {
      const matchesGroup = group === 'Todas' || groupOf(s) === group;
      const matchesFloor = floor === -1 || s.floor === floor;
      const matchesQuery = !q || norm(`${s.name} ${s.categories.join(' ')} ${groupOf(s)}`).includes(q);
      return matchesGroup && matchesFloor && matchesQuery;
    });
  }, [group, floor, storeSearchQuery]);

  const totalStorePages = Math.ceil(filteredDirectory.length / STORES_PER_PAGE) || 1;
  const paginatedDirectory = useMemo(() => {
    const start = (storePage - 1) * STORES_PER_PAGE;
    return filteredDirectory.slice(start, start + STORES_PER_PAGE);
  }, [filteredDirectory, storePage]);

  const focused = state.products.find((p) => p.id === focusedProductId) ?? null;

  return (
    <div className="space-y-8 pb-24">
      {/* Encabezado y Buscador de Productos */}
      <section className="wrap pt-4 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="subtle" className="mb-2">
              PaseoYa Express
            </Badge>
            <h1 className="headline text-3xl sm:text-4xl">Tienda PaseoYa</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Compra en línea y retira directamente en las tiendas del mall.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="h-10 pl-9 pr-8"
              />
              {productQuery && (
                <button
                  onClick={() => setProductQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => askJarvis('¿Qué me recomiendas comprar hoy en el Paseo?')}
              className="hidden shrink-0 items-center gap-1.5 sm:inline-flex"
            >
              <Sparkles size={14} className="text-white" />
              <span>Jarvis</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Chips de filtro por tienda con retiro */}
      <section className="wrap">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={storeFilter === null ? 'default' : 'secondary'}
            onClick={() => setStoreFilter(null)}
            className="rounded-full shrink-0"
          >
            Todos los locales
          </Button>
          {state.stores.map((s) => {
            const isSelected = storeFilter === s.id;
            return (
              <Button
                key={s.id}
                size="sm"
                variant={isSelected ? 'default' : 'secondary'}
                onClick={() => setStoreFilter(isSelected ? null : s.id)}
                className="rounded-full shrink-0 gap-2 font-normal"
              >
                <StoreLogo src={s.logoUrl} name={s.name} className="h-4 w-4 rounded-full" />
                <span>{s.name}</span>
              </Button>
            );
          })}
        </div>
      </section>

      {/* Catálogo de Productos con Paginación */}
      <section className="wrap">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="title-2 text-xl sm:text-2xl">
              {storeFilter ? getStore(storeFilter)?.name : 'Productos disponibles'}
            </h2>
            <span className="text-xs text-muted-foreground font-normal">
              ({filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'})
            </span>
          </div>
          {storeFilter && (
            <Button variant="ghost" size="sm" onClick={() => setStoreFilter(null)} className="text-xs">
              Limpiar filtro
            </Button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-base text-muted-foreground">
              No encontramos productos que coincidan con “{productQuery}”.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => askJarvis(productQuery)}
              className="mt-2 text-primary"
            >
              Preguntarle a Jarvis por alternativas <ChevronRight size={14} />
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((p) => {
                const st = getStore(p.storeId);
                return (
                  <Card
                    key={p.id}
                    className="group flex flex-col justify-between overflow-hidden border-border/60 bg-card transition-all hover:border-foreground/30 hover:shadow-lg"
                  >
                    <div
                      onClick={() => openProduct(p.id)}
                      className="cursor-pointer overflow-hidden bg-muted"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <ProductVisual
                          product={p}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-[11px]">
                            {st?.name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardHeader
                      onClick={() => openProduct(p.id)}
                      className="cursor-pointer p-4 pb-2"
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {st && floorLabel(st.floor)}
                      </div>
                      <CardTitle className="text-base line-clamp-1">{p.name}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {p.description}
                      </p>
                    </CardHeader>

                    <CardFooter className="flex items-center justify-between border-t border-border/40 p-4 pt-3">
                      <div>
                        <p className="text-base font-semibold">{formatBs(p.price)}</p>
                        <p className="text-[11px] text-white/90 font-medium">
                          +{formatPts(p.pointsReward)} pts
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => addToCart(p.id)}
                        disabled={p.stock === 0}
                        className="gap-1 rounded-full shadow-md"
                      >
                        <Plus size={14} />
                        <span>{p.stock === 0 ? 'Agotado' : 'Agregar'}</span>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Paginación de Productos */}
            {totalProductPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="text-xs text-muted-foreground">
                  Página {productPage} de {totalProductPages}
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                        disabled={productPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page} className="hidden sm:inline-block">
                        <PaginationLink
                          isActive={page === productPage}
                          onClick={() => setProductPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                        disabled={productPage >= totalProductPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </section>

      {/* Directorio de Tiendas: Búsqueda y Paginación (Sin scroll infinito) */}
      <section className="wrap border-t border-border/50 pt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StoreIcon size={18} className="text-primary" />
              <h2 className="title-2 text-xl sm:text-2xl font-semibold">Directorio del Mall</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Encuentra locales comerciales en los 5 niveles del Paseo.
            </p>
          </div>

          {/* Búsqueda directa de tiendas */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={storeSearchQuery}
              onChange={(e) => setStoreSearchQuery(e.target.value)}
              placeholder="Buscar tienda por nombre o rubro..."
              className="h-9 pl-9 pr-8 text-xs"
            />
            {storeSearchQuery && (
              <button
                onClick={() => setStoreSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda de tiendas"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {DIRECTORY_GROUPS.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={group === g ? 'default' : 'secondary'}
              onClick={() => setGroup(g)}
              className="rounded-full shrink-0 text-xs"
            >
              {g}
            </Button>
          ))}
        </div>

        {/* Filtros de Piso */}
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-4">
          {FLOORS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={floor === f ? 'outline' : 'ghost'}
              onClick={() => setFloor(f)}
              className={cn(
                'rounded-full shrink-0 text-xs h-7 px-3',
                floor === f && 'border-primary bg-primary/20 text-primary font-medium',
              )}
            >
              {f === -1 ? 'Todos los pisos' : floorLabel(f)}
            </Button>
          ))}
        </div>

        {filteredDirectory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No encontramos tiendas con los filtros seleccionados.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setStoreSearchQuery('');
                setGroup('Todas');
                setFloor(-1);
              }}
              className="mt-2 text-xs text-primary"
            >
              Restablecer filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {paginatedDirectory.map((s) => (
                <Card
                  key={s.id}
                  onClick={() => openStore(s.id)}
                  className="group cursor-pointer overflow-hidden border-border/60 bg-card transition-all hover:border-foreground/30 hover:shadow-lg"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Photo
                      src={s.image}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold leading-tight line-clamp-1">{s.name}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{floorLabel(s.floor)}</span>
                      <span className="truncate max-w-[100px]">{groupOf(s)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación de Tiendas */}
            {totalStorePages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="text-xs text-muted-foreground">
                  Página {storePage} de {totalStorePages} ({filteredDirectory.length} tiendas)
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setStorePage((p) => Math.max(1, p - 1))}
                        disabled={storePage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalStorePages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page} className="hidden sm:inline-block">
                        <PaginationLink
                          isActive={page === storePage}
                          onClick={() => setStorePage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setStorePage((p) => Math.min(totalStorePages, p + 1))}
                        disabled={storePage >= totalStorePages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </section>

      <ProductDetailModal product={focused} onClose={() => openProduct(null)} />
    </div>
  );
}

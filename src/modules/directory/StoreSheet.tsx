import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY, groupOf, type DirectoryStore } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { formatBs, formatPts } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { Photo, StoreLogo } from '@/components/ui/photo';
import { ProductVisual } from '@/modules/paseoya/ProductVisual';

/** Busca la tienda de PaseoYa que corresponde a una tienda del directorio real. */
export const paseoYaStoreFor = <T extends { name: string }>(d: DirectoryStore, stores: T[]) =>
  stores.find((s) => s.name.toLowerCase() === d.name.toLowerCase());

/** Ficha de tienda: foto, ubicación, galería, productos para retiro y beneficios. */
export function StoreSheet() {
  const { state, focusedStoreId, openStore, openProduct, askJarvis, setTab, currentUser } = useApp();
  const found = DIRECTORY.find((s) => s.id === focusedStoreId) ?? null;
  // Conserva la última tienda durante la animación de salida
  const [shown, setShown] = useState<DirectoryStore | null>(found);
  useEffect(() => {
    if (found) setShown(found);
  }, [found]);
  const store = found ?? shown;

  const linked = store ? paseoYaStoreFor(store, state.stores) : undefined;
  const products = linked ? state.products.filter((p) => p.storeId === linked.id) : [];
  const rewards = linked ? state.rewardsCatalog.filter((r) => r.storeId === linked.id) : [];
  const isClient = currentUser.role === 'client';
  const close = () => openStore(null);

  return (
    <Modal open={!!found} onClose={close} bleed>
      {store && (
        <div>
          <Photo src={store.image} alt={store.name} className="aspect-[16/10] w-full" eager />
          <div className="px-6 pt-5">
            <div className="flex items-center gap-3">
              <StoreLogo src={store.logo} name={store.name} className="h-12 w-12" />
              <div className="min-w-0">
                <h2 className="title-2 truncate">{store.name}</h2>
                <p className="text-[15px] text-muted-foreground">
                  {floorLabel(store.floor)} · {groupOf(store)}
                </p>
              </div>
            </div>
            {linked && <p className="mt-3 text-[15px] text-muted-foreground">Abierto hoy de {linked.schedule.replace(' - ', ' a ')}.</p>}
          </div>

          {store.gallery.length > 0 && (
            <div className="no-scrollbar mt-5 flex snap-x gap-2 overflow-x-auto px-6">
              {store.gallery.map((g, i) => (
                <Photo key={g} src={g} alt={`${store.name}, foto ${i + 1}`} className="h-40 w-32 shrink-0 snap-start rounded-xl" />
              ))}
            </div>
          )}

          {isClient && products.length > 0 && (
            <section className="mt-7 px-6">
              <h3 className="text-[19px] font-semibold">Para retirar hoy</h3>
              <div className="mt-3 divide-y divide-border">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      close();
                      openProduct(p.id);
                    }}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <ProductVisual product={p} className="h-14 w-14 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{p.name}</span>
                      <span className="block text-[13px] text-muted-foreground">{formatBs(p.price)}</span>
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {isClient && rewards.length > 0 && (
            <section className="mt-6 px-6">
              <h3 className="text-[19px] font-semibold">Beneficios con PaseoPoints</h3>
              {rewards.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    close();
                    setTab('points');
                  }}
                  className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left"
                >
                  <span className="text-[15px]">{r.title}</span>
                  <span className="text-[13px] text-muted-foreground tabular">{formatPts(r.costInPoints)} pts</span>
                </button>
              ))}
            </section>
          )}

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border px-6 pt-4 text-[15px]">
            {isClient && (
              <button className="link" onClick={() => askJarvis(`¿Cómo llego a ${store.name}?`)}>
                Preguntar a Jarvis <ChevronRight size={14} />
              </button>
            )}
            {store.social.instagram && (
              <a className="link" href={store.social.instagram} target="_blank" rel="noreferrer">
                Instagram <ChevronRight size={14} />
              </a>
            )}
            {store.social.whatsapp && (
              <a className="link" href={store.social.whatsapp} target="_blank" rel="noreferrer">
                WhatsApp <ChevronRight size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

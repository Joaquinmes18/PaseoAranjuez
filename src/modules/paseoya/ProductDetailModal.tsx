import { useEffect, useState } from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { DIRECTORY } from '@/data/directory';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { StoreLogo } from '@/components/ui/photo';
import { floorLabel } from '@/data/initialData';
import { formatBs, formatPts } from '@/lib/utils';
import { ProductVisual } from './ProductVisual';

export function ProductDetailModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { getStore, addToCart, setCartOpen, openStore } = useApp();
  const [qty, setQty] = useState(1);
  const [shown, setShown] = useState<Product | null>(product);
  useEffect(() => {
    if (product) {
      setShown(product);
      setQty(1);
    }
  }, [product]);

  const p = product ?? shown;
  const store = p ? getStore(p.storeId) : undefined;
  const dirStore = store ? DIRECTORY.find((d) => d.name.toLowerCase() === store.name.toLowerCase()) : undefined;

  return (
    <Modal open={!!product} onClose={onClose} bleed>
      {p && (
        <div>
          <ProductVisual product={p} className="aspect-[4/3] w-full" />
          <div className="px-6 pt-6">
            <p className="caption">Retiro en tienda</p>
            <h2 className="title-2 mt-1">{p.name}</h2>
            <p className="mt-2 text-[17px] text-muted-foreground">{p.description}</p>
            <p className="mt-4 text-[21px] font-semibold tabular">{formatBs(p.price * qty)}</p>
            <p className="text-[14px] text-muted-foreground">Ganas {formatPts(p.pointsReward * qty)} PaseoPoints al retirar.</p>

            {store && (
              <button
                onClick={() => {
                  if (!dirStore) return;
                  onClose();
                  openStore(dirStore.id);
                }}
                className="mt-6 flex w-full items-center gap-3 border-y border-border py-4 text-left"
              >
                <StoreLogo src={store.logoUrl} name={store.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{store.name}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {floorLabel(store.floor)} · Abierto de {store.schedule.replace(' - ', ' a ')}
                  </span>
                </span>
                {dirStore && <ChevronRight size={16} className="text-muted-foreground" />}
              </button>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full bg-surface">
                <button className="flex h-12 w-11 items-center justify-center text-muted-foreground disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} aria-label="Menos">
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center text-[17px] tabular">{qty}</span>
                <button className="flex h-12 w-11 items-center justify-center text-muted-foreground disabled:opacity-30" disabled={qty >= p.stock} onClick={() => setQty((q) => q + 1)} aria-label="Más">
                  <Plus size={16} />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                disabled={p.stock === 0}
                onClick={() => {
                  addToCart(p.id, qty);
                  onClose();
                  setCartOpen(true);
                }}
              >
                Agregar a la bolsa
              </Button>
            </div>
            <p className="caption mt-3">{p.stock} disponibles · Sin envío: lo retiras en el local con tu PIN.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

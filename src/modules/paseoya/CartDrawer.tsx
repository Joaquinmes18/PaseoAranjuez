import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import type { Order } from '@/types';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { floorLabel } from '@/data/initialData';
import { formatBs, formatPts } from '@/lib/utils';
import { ProductVisual } from './ProductVisual';
import { PickupTicket } from './PickupTicket';

/** Bolsa: revisión del pedido agrupado por local y confirmación de retiro. */
export function CartDrawer() {
  const { state, cartOpen, setCartOpen, getProduct, getStore, updateCartQty, createOrder, notify, setTab } = useApp();
  const [created, setCreated] = useState<Order[] | null>(null);

  const lines = state.cart.map((c) => ({ ...c, product: getProduct(c.productId)! })).filter((l) => l.product);
  const byStore = new Map<string, typeof lines>();
  lines.forEach((l) => byStore.set(l.product.storeId, [...(byStore.get(l.product.storeId) ?? []), l]));
  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  const points = lines.reduce((s, l) => s + l.product.pointsReward * l.quantity, 0);

  const checkout = () => {
    const res = createOrder();
    if (!res.ok) return notify({ kind: 'error', title: 'No se pudo confirmar', message: res.message });
    setCartOpen(false);
    setCreated(res.data!);
  };

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {cartOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                className="relative flex h-full w-full max-w-md flex-col bg-background shadow-lift"
              >
                <div className="flex items-start justify-between px-6 pb-2 pt-8">
                  <div>
                    <h2 className="title-2">Bolsa.</h2>
                    {lines.length > 0 && <p className="mt-1 text-[15px] text-muted-foreground">Retiras en {byStore.size === 1 ? 'un local' : `${byStore.size} locales`}. Pagas al retirar.</p>}
                  </div>
                  <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted-foreground" aria-label="Cerrar">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6">
                  {lines.length === 0 && <p className="py-16 text-[17px] text-muted-foreground">Tu bolsa está vacía.</p>}
                  {[...byStore.entries()].map(([storeId, items]) => {
                    const st = getStore(storeId);
                    return (
                      <section key={storeId} className="border-b border-border py-5">
                        <p className="caption">
                          Retiro en {st?.name} · {st && floorLabel(st.floor)}
                        </p>
                        {items.map((l) => (
                          <div key={l.productId} className="mt-4 flex gap-4">
                            <ProductVisual product={l.product} className="h-20 w-20 shrink-0 rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between gap-3">
                                <p className="text-[15px] font-semibold leading-snug">{l.product.name}</p>
                                <p className="shrink-0 text-[15px] tabular">{formatBs(l.product.price * l.quantity)}</p>
                              </div>
                              <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                                <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface" onClick={() => updateCartQty(l.productId, l.quantity - 1)} aria-label="Menos">
                                  <Minus size={14} />
                                </button>
                                <span className="w-5 text-center text-[15px] text-foreground tabular">{l.quantity}</span>
                                <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface" onClick={() => updateCartQty(l.productId, l.quantity + 1)} aria-label="Más">
                                  <Plus size={14} />
                                </button>
                                <button className="link ml-auto text-[13px]" onClick={() => updateCartQty(l.productId, 0)}>
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </section>
                    );
                  })}
                </div>

                {lines.length > 0 && (
                  <div className="border-t border-border px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
                    <dl className="space-y-1.5 text-[15px]">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Envío</dt>
                        <dd>Retiro en tienda</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">PaseoPoints al retirar</dt>
                        <dd className="tabular">{formatPts(points)}</dd>
                      </div>
                      <div className="flex justify-between pt-2 text-[19px] font-semibold">
                        <dt>Total</dt>
                        <dd className="tabular">{formatBs(total)}</dd>
                      </div>
                    </dl>
                    <Button size="lg" className="mt-4 w-full" onClick={checkout}>
                      Confirmar pedido
                    </Button>
                  </div>
                )}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <Modal
        open={!!created}
        onClose={() => setCreated(null)}
        title="Tu pedido está confirmado."
        description={created && created.length > 1 ? 'Recibirás un pase por cada local.' : 'Muestra el PIN o el código al retirar.'}
      >
        <div className="space-y-4">
          {created?.map((o) => (
            <PickupTicket key={o.orderId} order={o} />
          ))}
        </div>
        <Button
          className="mt-6 w-full"
          size="lg"
          variant="secondary"
          onClick={() => {
            setCreated(null);
            setTab('orders');
          }}
        >
          Ver mis pedidos
        </Button>
      </Modal>
    </>
  );
}

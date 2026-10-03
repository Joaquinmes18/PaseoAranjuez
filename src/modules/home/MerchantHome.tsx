import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { floorLabel } from '@/data/initialData';
import { formatBs, formatPts, timeAgo } from '@/lib/utils';
import { Photo, StoreLogo } from '@/components/ui/photo';
import { NetworkIndicator } from '@/components/web3/WalletBadge';

/** Resumen del comercio: foto del local, cifras del día y accesos a las herramientas de caja. */
export function MerchantHome() {
  const { state, currentStore, currentUser, setTab } = useApp();
  const orders = state.orders.filter((o) => o.storeId === currentStore?.id);
  const pending = orders.filter((o) => o.status === 'Listo para recoger');
  const delivered = orders.filter((o) => o.status === 'Entregado');
  const issued = state.transactions.filter((t) => t.type === 'mint' && currentStore && t.reason.includes(currentStore.name)).reduce((s, t) => s + t.amount, 0);
  const coupons = state.coupons.filter((c) => c.status === 'Activo' && (!c.storeId || c.storeId === currentStore?.id)).length;
  const revenue = delivered.reduce((s, o) => s + o.totalPrice, 0);

  const stats = [
    { label: 'Pedidos por entregar', value: String(pending.length) },
    { label: 'Entregados', value: String(delivered.length) },
    { label: 'Ventas PaseoYa', value: formatBs(revenue) },
    { label: 'PaseoPoints emitidos', value: formatPts(issued) },
  ];

  const actions = [
    { label: 'Validar un retiro', desc: 'Con el PIN o el código del cliente', tab: 'm-pickups' as const },
    { label: 'Acreditar puntos', desc: 'Por una compra hecha en caja', tab: 'm-points' as const },
    { label: 'Validar un cupón', desc: `${coupons} cupones activos para este local`, tab: 'm-coupons' as const },
  ];

  return (
    <div className="pb-20">
      <section className="wrap pt-12">
        <div className="flex items-center gap-4">
          <StoreLogo src={currentStore?.logoUrl} name={currentStore?.name ?? ''} className="h-14 w-14" />
          <div>
            <h1 className="title-1">{currentStore?.name}</h1>
            <p className="text-[17px] text-muted-foreground">
              {currentStore && floorLabel(currentStore.floor)} · {currentUser.name}
            </p>
          </div>
        </div>
        <NetworkIndicator className="mt-4" />
      </section>

      <section className="wrap mt-8">
        <Photo src={currentStore?.bannerUrl} alt={currentStore?.name ?? ''} className="aspect-[21/9] w-full rounded-tile" eager />
      </section>

      <section className="wrap mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-[34px] font-semibold leading-none tabular">{s.value}</p>
            <p className="mt-2 text-[14px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="wrap mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="title-2">Herramientas</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {actions.map((a) => (
              <button key={a.tab} onClick={() => setTab(a.tab)} className="flex w-full items-center justify-between py-4 text-left">
                <span>
                  <span className="block text-[17px]">{a.label}</span>
                  <span className="block text-[14px] text-muted-foreground">{a.desc}</span>
                </span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="title-2">Por entregar</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {pending.length === 0 && <p className="py-4 text-[15px] text-muted-foreground">No hay pedidos pendientes.</p>}
            {pending.map((o) => (
              <button key={o.orderId} onClick={() => setTab('m-pickups')} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-[17px]">{o.userName}</span>
                  <span className="block truncate text-[14px] text-muted-foreground">
                    {o.orderId} · {o.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[14px] text-muted-foreground">
                  <span className="block text-foreground tabular">{formatBs(o.totalPrice)}</span>
                  {timeAgo(o.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

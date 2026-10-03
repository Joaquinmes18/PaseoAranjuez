import { QRCodeSVG } from 'qrcode.react';
import type { Order } from '@/types';
import { useApp } from '@/context/AppContext';
import { floorLabel } from '@/data/initialData';
import { cn, formatBs, formatPts } from '@/lib/utils';
import { Photo, StoreLogo } from '@/components/ui/photo';

/** Pase de retiro (estilo Apple Wallet): foto de la tienda, PIN, QR y detalles. */
export function PickupTicket({ order, compact = false }: { order: Order; compact?: boolean }) {
  const { getStore } = useApp();
  const store = getStore(order.storeId);
  const delivered = order.status === 'Entregado';
  const items = order.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ');

  if (compact) {
    return (
      <div className="flex items-center gap-4 py-4">
        <StoreLogo src={store?.logoUrl} name={order.storeName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{order.storeName}</p>
          <p className="truncate text-[13px] text-muted-foreground">{items}</p>
        </div>
        <div className="text-right text-[13px]">
          <p className="tabular">{formatBs(order.totalPrice)}</p>
          <p className={cn(delivered ? 'text-success' : 'text-muted-foreground')}>{delivered ? `+${formatPts(order.pointsToEarn)} pts` : order.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tile border border-border shadow-tile">
      <div className="relative">
        <Photo src={store?.bannerUrl} alt={order.storeName} className="h-28 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between text-white">
          <div>
            <p className="text-[12px] opacity-80">Retiro en tienda</p>
            <p className="text-[19px] font-semibold leading-tight">{order.storeName}</p>
          </div>
          <p className="text-[12px] opacity-80 tabular">{order.orderId}</p>
        </div>
      </div>

      <div className="flex items-center gap-5 px-5 py-5">
        <div className="min-w-0 flex-1">
          <p className="caption">PIN de retiro</p>
          <p className="font-display text-[44px] font-semibold leading-none tracking-[0.12em] tabular">{order.pickupPin}</p>
          <p className="mt-3 text-[13px] text-muted-foreground">{store ? floorLabel(store.floor) : ''}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white p-2 ring-1 ring-black/5">
          <QRCodeSVG value={order.pickupQrCode} size={104} fgColor="#1d1d1f" />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-border px-5 py-4 text-[13px]">
        <div className="col-span-2">
          <dt className="text-muted-foreground">Artículos</dt>
          <dd>{items}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pagas en tienda</dt>
          <dd className="tabular">{formatBs(order.totalPrice)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ganas</dt>
          <dd className="tabular">{formatPts(order.pointsToEarn)} PaseoPoints</dd>
        </div>
      </dl>
    </div>
  );
}

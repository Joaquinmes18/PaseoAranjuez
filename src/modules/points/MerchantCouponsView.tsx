import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ScannerModal } from '@/components/common/ScannerModal';
import { Button } from '@/components/ui/button';
import { Photo } from '@/components/ui/photo';
import { cn, timeAgo } from '@/lib/utils';
import { useRewardImage } from './RewardsCatalog';

/** Validación de cupones canjeados con PaseoPoints. */
export function MerchantCouponsView() {
  const { state, currentStore, validateCoupon } = useApp();
  const imageFor = useRewardImage();
  const [scanOpen, setScanOpen] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const relevant = state.coupons.filter((c) => !c.storeId || c.storeId === currentStore?.id);

  return (
    <div className="wrap max-w-[720px] pb-20 pt-12">
      <h1 className="title-1">Validar cupones</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Beneficios válidos en {currentStore?.name} o en todo el Paseo.</p>
      <Button size="lg" className="mt-6" onClick={() => setScanOpen(true)}>
        Escanear cupón
      </Button>
      {result && <p className={cn('mt-4 text-[15px]', result.ok ? 'text-success' : 'text-danger')}>{result.message}</p>}

      <h2 className="title-2 mt-12">Cupones emitidos</h2>
      <div className="mt-4 divide-y divide-border border-y border-border">
        {relevant.length === 0 && <p className="py-4 text-[15px] text-muted-foreground">Aún no hay cupones. Canjea uno desde el rol de cliente.</p>}
        {relevant.map((c) => {
          const reward = state.rewardsCatalog.find((r) => r.id === c.rewardId);
          return (
            <div key={c.couponId} className="flex items-center gap-4 py-3">
              <Photo src={reward ? imageFor(reward) : undefined} alt={c.rewardTitle} className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{c.rewardTitle}</p>
                <p className="text-[13px] text-muted-foreground">
                  {c.code} · {timeAgo(c.createdAt)}
                </p>
              </div>
              <span className={cn('text-[14px]', c.status === 'Activo' ? 'text-success' : 'text-muted-foreground')}>{c.status}</span>
            </div>
          );
        })}
      </div>

      <ScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Escanear cupón"
        placeholder="CPN-XXXXX"
        suggestions={relevant.filter((c) => c.status === 'Activo').map((c) => ({ label: c.code, value: c.code }))}
        onResult={(v) => setResult(validateCoupon(v, currentStore?.id))}
      />
    </div>
  );
}

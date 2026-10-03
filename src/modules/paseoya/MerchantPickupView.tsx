import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { ScannerModal } from '@/components/common/ScannerModal';
import { Button } from '@/components/ui/button';
import { cn, formatBs, formatPts, timeAgo } from '@/lib/utils';

/** Validación de retiro: PIN o código QR → pedido entregado → PaseoPoints acreditados. */
export function MerchantPickupView() {
  const { state, currentStore, deliverOrder } = useApp();
  const [pin, setPin] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const storeOrders = state.orders.filter((o) => o.storeId === currentStore?.id);
  const pending = storeOrders.filter((o) => o.status === 'Listo para recoger');
  const delivered = storeOrders.filter((o) => o.status === 'Entregado');

  const validate = async (code: string) => {
    if (!code.trim()) return;
    setBusy(true);
    setResult(null);
    const res = await deliverOrder(code, currentStore?.id);
    setBusy(false);
    setResult(res);
    if (res.ok) setPin('');
    else setShake((s) => s + 1);
  };

  const onPinChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    if (digits.length === 4) validate(digits);
  };

  return (
    <div className="wrap grid gap-12 pb-20 pt-12 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="title-1">Validar retiro</h1>
        <p className="mt-1 text-[17px] text-muted-foreground">Ingresa el PIN de cuatro dígitos del cliente.</p>

        <motion.button
          key={shake}
          animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
          transition={{ duration: 0.3 }}
          onClick={() => inputRef.current?.focus()}
          className="mt-6 grid w-full grid-cols-4 gap-3"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'flex h-16 items-center justify-center rounded-xl border font-display text-[32px] font-semibold tabular',
                pin.length === i ? 'border-primary ring-2 ring-primary/15' : 'border-input',
              )}
            >
              {pin[i] ?? ''}
            </span>
          ))}
        </motion.button>
        <input ref={inputRef} autoFocus inputMode="numeric" autoComplete="one-time-code" value={pin} onChange={(e) => onPinChange(e.target.value)} className="sr-only" aria-label="PIN de retiro" />

        <div className="mt-4 flex gap-3">
          <Button size="lg" className="flex-1" disabled={pin.length !== 4 || busy} onClick={() => validate(pin)}>
            {busy ? 'Validando…' : 'Entregar pedido'}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setScanOpen(true)}>
            Escanear
          </Button>
        </div>

        {result && (
          <p className={cn('mt-5 text-[15px]', result.ok ? 'text-success' : 'text-danger')}>
            {result.message}
            {result.ok && <span className="block text-muted-foreground">Los PaseoPoints se acreditaron al cliente.</span>}
          </p>
        )}
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="title-2">Por entregar</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {pending.length === 0 && <p className="py-4 text-[15px] text-muted-foreground">No hay pedidos pendientes.</p>}
            {pending.map((o) => (
              <div key={o.orderId} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px]">{o.userName}</p>
                  <p className="truncate text-[14px] text-muted-foreground">
                    {o.orderId} · {o.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {formatBs(o.totalPrice)} · {formatPts(o.pointsToEarn)} puntos · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => validate(o.pickupQrCode)} title="Simula el escaneo del código del cliente">
                  Validar
                </Button>
              </div>
            ))}
          </div>
        </section>

        {delivered.length > 0 && (
          <section>
            <h2 className="title-2">Entregados</h2>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {delivered.map((o) => (
                <div key={o.orderId} className="flex justify-between py-3 text-[15px]">
                  <span>
                    {o.orderId} · {o.userName}
                  </span>
                  <span className="text-muted-foreground tabular">+{formatPts(o.pointsToEarn)} pts</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Escanear pedido"
        placeholder="ORDER-ORD-100-PIN-8452 o PIN"
        suggestions={pending.map((o) => ({ label: o.orderId, value: o.pickupQrCode }))}
        onResult={validate}
      />
    </div>
  );
}

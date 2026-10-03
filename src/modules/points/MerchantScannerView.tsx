import { useState } from 'react';
import { Delete } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ScannerModal } from '@/components/common/ScannerModal';
import { Button } from '@/components/ui/button';
import { formatPts, timeAgo } from '@/lib/utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/** Acreditar PaseoPoints por una compra en caja: código del cliente + monto (1 Bs = 1 punto). */
export function MerchantScannerView() {
  const { state, currentStore, registerInStorePurchase, notify } = useApp();
  const [scanOpen, setScanOpen] = useState(false);
  const [clientQr, setClientQr] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const client = state.users.find((u) => u.qrCode.toUpperCase() === clientQr.toUpperCase() && u.role === 'client');
  const points = Math.floor(Number(amount) || 0);
  const recent = state.transactions.filter((t) => t.type === 'mint' && currentStore && t.reason.includes(currentStore.name)).slice(0, 6);

  const press = (k: string) => {
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    if (k === '.' && amount.includes('.')) return;
    if (amount.length >= 7) return;
    setAmount((a) => (a === '0' && k !== '.' ? k : a + k));
  };

  const submit = async () => {
    setBusy(true);
    const res = await registerInStorePurchase(clientQr, Number(amount));
    setBusy(false);
    if (res.ok) {
      setAmount('');
      setClientQr('');
    } else notify({ kind: 'error', title: 'No se pudo acreditar', message: res.message });
  };

  return (
    <div className="wrap grid gap-12 pb-20 pt-12 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="title-1">Acreditar puntos</h1>
        <p className="mt-1 text-[17px] text-muted-foreground">Un punto por cada boliviano de la compra.</p>

        <div className="mt-6 flex items-center justify-between border-y border-border py-4">
          <div>
            <p className="caption">Cliente</p>
            <p className="text-[17px]">{client ? client.name : 'Sin identificar'}</p>
            {client && <p className="text-[13px] text-muted-foreground">Saldo actual: {formatPts(client.pointsBalance)} puntos</p>}
          </div>
          <Button size="sm" variant="secondary" onClick={() => (client ? setClientQr('') : setScanOpen(true))}>
            {client ? 'Cambiar' : 'Escanear código'}
          </Button>
        </div>

        <p className="caption mt-6">Monto de la compra</p>
        <p className="mt-1 text-right font-display text-[44px] font-semibold tabular">Bs {amount || '0'}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button key={k} onClick={() => press(k)} className="flex h-14 items-center justify-center rounded-xl bg-surface text-[22px] transition active:bg-muted-foreground/20" aria-label={k === 'del' ? 'Borrar' : k}>
              {k === 'del' ? <Delete size={20} /> : k}
            </button>
          ))}
        </div>

        <Button size="lg" className="mt-4 w-full" disabled={!client || points < 1 || busy} onClick={submit}>
          {busy ? 'Registrando…' : points > 0 ? `Acreditar ${formatPts(points)} puntos` : 'Acreditar puntos'}
        </Button>
      </div>

      <section>
        <h2 className="title-2">Últimas acreditaciones</h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {recent.length === 0 && <p className="py-4 text-[15px] text-muted-foreground">Todavía no hay acreditaciones en este local.</p>}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-[17px]">{state.users.find((u) => u.id === t.userId)?.name}</p>
                <p className="truncate text-[14px] text-muted-foreground">
                  {t.reason} · {timeAgo(t.timestamp)}
                </p>
              </div>
              <span className="shrink-0 text-[15px] text-success tabular">+{formatPts(t.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      <ScannerModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Código del cliente"
        placeholder="QR-USR-001"
        suggestions={state.users.filter((u) => u.role === 'client').map((u) => ({ label: u.name, value: u.qrCode }))}
        onResult={(v) => {
          const found = state.users.find((u) => u.qrCode.toUpperCase() === v.trim().toUpperCase() && u.role === 'client');
          if (found) setClientQr(found.qrCode);
          else notify({ kind: 'error', title: 'Código no reconocido', message: v });
        }}
      />
    </div>
  );
}

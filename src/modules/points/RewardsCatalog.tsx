import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Coupon, Reward } from '@/types';
import { useApp } from '@/context/AppContext';
import { floorLabel } from '@/data/initialData';
import { formatPts } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Photo } from '@/components/ui/photo';

/** Imagen del beneficio: la propia o la foto real de la tienda que lo ofrece. */
export function useRewardImage() {
  const { getStore } = useApp();
  return (r: Pick<Reward, 'imageUrl' | 'storeId'>) => r.imageUrl ?? (r.storeId ? getStore(r.storeId)?.bannerUrl : undefined) ?? '/img/paseo-edificio.jpg';
}

/** Catálogo de beneficios con fotografía de cada tienda y confirmación del canje. */
export function RewardsCatalog() {
  const { state, currentUser, redeemReward, notify, getStore } = useApp();
  const imageFor = useRewardImage();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const close = () => {
    if (busy) return;
    setSelected(null);
    setTimeout(() => setCoupon(null), 250);
  };

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    const res = await redeemReward(selected.id);
    setBusy(false);
    if (res.ok && res.data) setCoupon(res.data);
    else notify({ kind: 'error', title: 'No se pudo canjear', message: res.message });
  };

  const rewards = [...state.rewardsCatalog].sort((a, b) => a.costInPoints - b.costInPoints);
  const placeOf = (r: Reward) => {
    const st = r.storeId ? getStore(r.storeId) : undefined;
    return st ? `${st.name} · ${floorLabel(st.floor)}` : 'Paseo Aranjuez';
  };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {rewards.map((r) => {
          const affordable = currentUser.pointsBalance >= r.costInPoints;
          return (
            <article key={r.id} className="group">
              <button onClick={() => setSelected(r)} className="block w-full overflow-hidden rounded-tile">
                <Photo src={imageFor(r)} alt={r.title} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-[1.02]" />
              </button>
              <p className="caption mt-3">{placeOf(r)}</p>
              <h3 className="mt-0.5 text-[21px] font-semibold leading-tight">{r.title}</h3>
              <p className="mt-1 text-[15px] text-muted-foreground">{r.description}</p>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-[15px] tabular">{formatPts(r.costInPoints)} puntos</span>
                {r.stock <= 0 ? (
                  <span className="text-[15px] text-muted-foreground">Agotado</span>
                ) : affordable ? (
                  <Button size="sm" onClick={() => setSelected(r)}>
                    Canjear
                  </Button>
                ) : (
                  <span className="text-[15px] text-muted-foreground">Te faltan {formatPts(r.costInPoints - currentUser.pointsBalance)}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={!!selected} onClose={close} bleed>
        {selected && !coupon && (
          <div>
            <Photo src={imageFor(selected)} alt={selected.title} className="aspect-[16/9] w-full" />
            <div className="px-6 pt-6">
              <p className="caption">{placeOf(selected)}</p>
              <h2 className="title-2 mt-1">{selected.title}</h2>
              <p className="mt-2 text-[15px] text-muted-foreground">{selected.description}</p>
              <dl className="mt-6 space-y-2 border-t border-border pt-4 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Saldo actual</dt>
                  <dd className="tabular">{formatPts(currentUser.pointsBalance)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Canje</dt>
                  <dd className="tabular">−{formatPts(selected.costInPoints)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Saldo después del canje</dt>
                  <dd className="tabular">{formatPts(currentUser.pointsBalance - selected.costInPoints)}</dd>
                </div>
              </dl>
              <Button size="lg" className="mt-6 w-full" disabled={busy || currentUser.pointsBalance < selected.costInPoints} onClick={confirm}>
                {busy ? 'Procesando…' : currentUser.pointsBalance < selected.costInPoints ? 'Saldo insuficiente' : 'Canjear beneficio'}
              </Button>
            </div>
          </div>
        )}
        {coupon && (
          <div className="flex flex-col items-center px-6 pt-10 text-center">
            <h2 className="title-2">Listo. Tu cupón está activo.</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">{coupon.rewardTitle}. Muéstralo en caja.</p>
            <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <QRCodeSVG value={coupon.code} size={184} fgColor="#1d1d1f" />
            </div>
            <p className="mt-4 font-display text-[24px] font-semibold tracking-[0.12em] tabular">{coupon.code}</p>
            <Button className="mt-6 w-full" size="lg" variant="secondary" onClick={close}>
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

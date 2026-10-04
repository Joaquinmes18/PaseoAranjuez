import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useWeb3 } from '@/context/Web3Context';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Photo } from '@/components/ui/photo';
import { NetworkIndicator } from '@/components/web3/WalletBadge';
import { POLYGONSCAN_TX, cn, formatPts, shortAddr, timeAgo } from '@/lib/utils';
import { RewardsCatalog, useRewardImage } from './RewardsCatalog';

type Section = 'rewards' | 'activity' | 'coupons';

/** PaseoPoints: tarjeta tipo Apple Wallet, beneficios con foto, actividad y cupones. */
export function ClientPointsView() {
  const { currentUser, state, notify, getStore } = useApp();
  const { readOnChainBalance, tokenAddress } = useWeb3();
  const imageFor = useRewardImage();
  const [qrOpen, setQrOpen] = useState(false);
  const [section, setSection] = useState<Section>('rewards');
  const [couponOpen, setCouponOpen] = useState<string | null>(null);
  const [onChainBalance, setOnChainBalance] = useState<number | null>(null);

  useEffect(() => {
    if (tokenAddress) readOnChainBalance(currentUser.walletAddress).then(setOnChainBalance);
  }, [tokenAddress, readOnChainBalance, currentUser.walletAddress, currentUser.pointsBalance]);

  const txs = state.transactions.filter((t) => t.userId === currentUser.id);
  const coupons = state.coupons.filter((c) => c.userId === currentUser.id);
  const openCoupon = coupons.find((c) => c.couponId === couponOpen);

  return (
    <div className="wrap pb-20 pt-12">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="headline">PaseoPoints.</h1>
          <p className="subhead mt-2">Gana un punto por cada boliviano que gastas en el Paseo y canjéalos por beneficios en tus tiendas favoritas.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setQrOpen(true)}>
              Mostrar mi código
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(currentUser.walletAddress);
                notify({ kind: 'info', title: 'Dirección copiada' });
              }}
            >
              Copiar dirección
            </Button>
          </div>
          <NetworkIndicator className="mt-6" />
        </div>

        {/* Tarjeta estilo Perla / Blanco Hueso */}
        <button
          onClick={() => setQrOpen(true)}
          className="relative aspect-[1.586/1] w-full max-w-md justify-self-center overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-[#FAF8F5] via-[#F4F1EA] to-[#E9E4DC] p-6 text-left text-[#07012F] shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1),0_10px_25px_-5px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-[1.02] md:justify-self-end"
        >
          {/* Reflejo de luz satinado / perla */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/70 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between">
              <img
                src="/img/paseo-logo.png"
                alt="Paseo Aranjuez"
                className="h-11 w-auto invert sm:h-12"
              />
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#07012F]/60">
                  PaseoPoints
                </p>
                <p className="text-[28px] font-bold leading-none tabular tracking-tight text-[#07012F]">
                  {formatPts(currentUser.pointsBalance)}
                </p>
              </div>
            </div>
            <div className="mt-auto flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#07012F]/60">
                  Titular
                </p>
                <p className="text-[16px] font-semibold text-[#07012F]">{currentUser.name}</p>
              </div>
              <p className="font-mono text-[12px] font-medium text-[#07012F]/70">
                {shortAddr(currentUser.walletAddress)}
              </p>
            </div>
          </div>
        </button>
      </div>
      {onChainBalance !== null && <p className="caption mt-3 text-right">Saldo verificado en el contrato: {formatPts(onChainBalance)} PASEO</p>}

      <Segmented
        className="mt-16"
        value={section}
        onChange={setSection}
        options={[
          { value: 'rewards', label: 'Beneficios' },
          { value: 'activity', label: 'Actividad' },
          { value: 'coupons', label: `Mis cupones${coupons.length ? ` (${coupons.length})` : ''}` },
        ]}
      />

      <div className="mt-8">
        {section === 'rewards' && <RewardsCatalog />}

        {section === 'activity' && (
          <div className="divide-y divide-border border-y border-border">
            {txs.length === 0 && <p className="py-6 text-[15px] text-muted-foreground">Sin movimientos todavía.</p>}
            {txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{t.reason}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {timeAgo(t.timestamp)}
                    {t.onChain && (
                      <a href={POLYGONSCAN_TX(t.txHash)} target="_blank" rel="noreferrer" className="link ml-2">
                        Ver transacción <ExternalLink size={11} />
                      </a>
                    )}
                  </p>
                </div>
                <p className={cn('shrink-0 text-[15px] tabular', t.type === 'mint' ? 'text-success' : 'text-foreground')}>
                  {t.type === 'mint' ? '+' : '−'}
                  {formatPts(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {section === 'coupons' && (
          <div className="grid gap-6 sm:grid-cols-2">
            {coupons.length === 0 && <p className="text-[15px] text-muted-foreground">Aún no canjeaste beneficios.</p>}
            {coupons.map((c) => {
              const reward = state.rewardsCatalog.find((r) => r.id === c.rewardId);
              return (
                <button key={c.couponId} onClick={() => setCouponOpen(c.couponId)} className={cn('flex items-center gap-4 text-left', c.status === 'Usado' && 'opacity-50')}>
                  <Photo src={reward ? imageFor(reward) : undefined} alt={c.rewardTitle} className="h-16 w-16 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{c.rewardTitle}</span>
                    <span className="block text-[13px] text-muted-foreground">
                      {c.code} · {c.status}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Tu código PaseoPoints" description="Muéstralo en caja para sumar puntos en cualquier tienda.">
        <div className="flex flex-col items-center pb-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <QRCodeSVG value={currentUser.qrCode} size={220} fgColor="#1d1d1f" level="M" />
          </div>
          <p className="mt-4 font-mono text-[15px] tracking-widest">{currentUser.qrCode}</p>
        </div>
      </Modal>

      <Modal
        open={!!openCoupon}
        onClose={() => setCouponOpen(null)}
        title={openCoupon?.rewardTitle}
        description={openCoupon?.storeId ? `Válido en ${getStore(openCoupon.storeId)?.name}.` : 'Válido en Paseo Aranjuez.'}
      >
        {openCoupon && (
          <div className="flex flex-col items-center pb-2">
            <div className={cn('rounded-2xl bg-white p-5 ring-1 ring-black/5', openCoupon.status === 'Usado' && 'opacity-30')}>
              <QRCodeSVG value={openCoupon.code} size={200} fgColor="#1d1d1f" />
            </div>
            <p className="mt-4 font-display text-[22px] font-semibold tracking-[0.12em]">{openCoupon.code}</p>
            <p className="text-[13px] text-muted-foreground">{openCoupon.status === 'Activo' ? 'Activo' : 'Ya utilizado'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

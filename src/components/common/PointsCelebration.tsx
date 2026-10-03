import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { POLYGONSCAN_TX, formatPts, shortAddr } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from './Modal';

/** Confirmación de PaseoPoints acreditados: sobria, como un "Listo" de Apple Pay. */
export function PointsCelebration() {
  const { celebration, clearCelebration } = useApp();

  useEffect(() => {
    if (!celebration) return;
    const id = setTimeout(clearCelebration, 7000);
    return () => clearTimeout(id);
  }, [celebration, clearCelebration]);

  return (
    <Modal open={!!celebration} onClose={clearCelebration} className="sm:max-w-sm">
      {celebration && (
        <div className="flex flex-col items-center pt-10 text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check size={32} strokeWidth={2.5} />
          </motion.span>
          <p className="mt-5 text-[15px] text-muted-foreground">{celebration.userName} recibió</p>
          <p className="font-display text-[48px] font-semibold leading-tight tracking-tight tabular">+{formatPts(celebration.amount)}</p>
          <p className="text-[17px] font-medium">PaseoPoints</p>
          <p className="mt-3 max-w-xs text-[14px] text-muted-foreground">{celebration.reason}</p>

          <a
            href={celebration.onChain ? POLYGONSCAN_TX(celebration.txHash) : undefined}
            target="_blank"
            rel="noreferrer"
            className="caption mt-5 inline-flex items-center gap-1 font-mono"
          >
            {celebration.onChain ? 'Polygon Amoy' : 'Registro simulado'} · {shortAddr(celebration.txHash)}
            {celebration.onChain && <ExternalLink size={11} />}
          </a>
          <Button className="mt-6 w-full" size="lg" onClick={clearCelebration}>
            Listo
          </Button>
        </div>
      )}
    </Modal>
  );
}

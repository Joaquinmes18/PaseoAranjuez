import { useWeb3 } from '@/context/Web3Context';
import { cn } from '@/lib/utils';

/** Estado de red en una línea de texto discreta. */
export function NetworkIndicator({ className }: { className?: string }) {
  const { mode, networkStatus, blockNumber, chainName, pendingTx } = useWeb3();
  const dot = networkStatus === 'online' ? 'bg-success' : networkStatus === 'checking' ? 'bg-gold' : 'bg-muted-foreground';
  return (
    <p className={cn('caption flex flex-wrap items-center gap-x-1.5', className)}>
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
      {chainName}
      {blockNumber && <span className="tabular">· bloque {blockNumber.toLocaleString('es-BO')}</span>}
      <span>· {mode === 'onchain' ? 'relayer en cadena' : 'relayer simulado'}</span>
      {pendingTx > 0 && <span className="text-foreground">· registrando transacción…</span>}
    </p>
  );
}

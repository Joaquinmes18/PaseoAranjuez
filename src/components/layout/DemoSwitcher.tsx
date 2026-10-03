import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronUp, RotateCcw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

/** Selector de rol para la demo: discreto, en la esquina. */
export function DemoSwitcher() {
  const { state, currentUser, switchRole, resetDemo } = useApp();
  const [open, setOpen] = useState(false);
  const clients = state.users.filter((u) => u.role === 'client');
  const cashiers = state.users.filter((u) => u.role === 'merchant');

  const Row = ({ id, name, sub }: { id: string; name: string; sub: string }) => (
    <button
      onClick={() => {
        switchRole(id);
        setOpen(false);
      }}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-surface"
    >
      <span>
        <span className="block text-[14px]">{name}</span>
        <span className="block text-[12px] text-muted-foreground">{sub}</span>
      </span>
      {id === currentUser.id && <Check size={15} className="text-link" />}
    </button>
  );

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+68px)] right-3 z-50 flex flex-col items-end md:bottom-5 md:right-5">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            className="mb-2 w-64 rounded-2xl border border-border bg-card p-1.5 shadow-lift"
          >
            <p className="caption px-3 pb-1 pt-2">Cliente</p>
            {clients.map((u) => (
              <Row key={u.id} id={u.id} name={u.name} sub="Compras y PaseoPoints" />
            ))}
            <p className="caption px-3 pb-1 pt-3">Cajeros</p>
            {cashiers.map((u) => (
              <Row key={u.id} id={u.id} name={state.stores.find((s) => s.id === u.storeId)?.name ?? u.name} sub="Validación en caja" />
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => {
                if (confirm('¿Restablecer los datos de la demo?')) {
                  resetDemo();
                  setOpen(false);
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-danger hover:bg-surface"
            >
              <RotateCcw size={14} /> Restablecer datos
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/90 pl-3.5 pr-3 text-[13px] shadow-tile backdrop-blur"
      >
        <span className="text-muted-foreground">Demo:</span>
        <span className="max-w-[9rem] truncate font-medium">
          {currentUser.role === 'merchant' ? state.stores.find((s) => s.id === currentUser.storeId)?.name : currentUser.name}
        </span>
        <ChevronUp size={14} className={cn('text-muted-foreground transition', !open && 'rotate-180')} />
      </button>
    </div>
  );
}

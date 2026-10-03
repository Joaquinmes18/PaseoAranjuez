import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

/** Avisos breves en una píldora oscura al pie de la pantalla (estilo iOS). */
export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+64px)] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8">
      <AnimatePresence initial={false}>
        {toasts.slice(-2).map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismissToast(t.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-auto max-w-sm rounded-2xl bg-foreground/90 px-4 py-2.5 text-left text-background shadow-lift backdrop-blur"
          >
            <p className={cn('text-[14px] font-semibold', t.kind === 'error' && 'text-red-300 dark:text-red-600')}>{t.title}</p>
            {t.message && <p className="truncate text-[13px] opacity-75">{t.message}</p>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

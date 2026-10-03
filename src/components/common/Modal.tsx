import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Contenido a sangre (sin padding lateral), p. ej. una foto de cabecera. */
  bleed?: boolean;
}

/** Hoja modal: en móvil sube desde abajo (arrastrable); en desktop, diálogo centrado. */
export function Modal({ open, onClose, title, description, children, className, bleed }: ModalProps) {
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            className={cn(
              'relative max-h-[92dvh] w-full overflow-y-auto rounded-t-sheet bg-card pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lift sm:max-w-lg sm:rounded-sheet',
              className,
            )}
          >
            <div onPointerDown={(e) => drag.start(e)} className="absolute inset-x-0 top-0 z-20 flex h-6 cursor-grab touch-none justify-center pt-2 sm:hidden">
              <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-muted-foreground backdrop-blur transition hover:text-foreground"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
            {(title || description) && (
              <div className="px-6 pb-4 pr-14 pt-8">
                {title && <h2 className="title-2">{title}</h2>}
                {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
              </div>
            )}
            <div className={bleed ? '' : 'px-6'}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

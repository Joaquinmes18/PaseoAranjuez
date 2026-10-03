import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Keyboard, Loader2, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/button';

export interface ScanSuggestion {
  label: string;
  value: string;
}

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (value: string) => void;
  title: string;
  placeholder?: string;
  /** Atajos para simular un escaneo en laptops sin cámara (modo demo). */
  suggestions?: ScanSuggestion[];
}

const READER_ID = 'qr-reader';

export function ScannerModal({ open, onClose, onResult, title, placeholder, suggestions = [] }: ScannerModalProps) {
  const [cameraState, setCameraState] = useState<'starting' | 'running' | 'error'>('starting');
  const [manual, setManual] = useState('');
  const doneRef = useRef(false);

  const finish = (value: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onResult(value);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    doneRef.current = false;
    setManual('');
    setCameraState('starting');
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    // Esperar a que el portal monte el contenedor del lector
    const t = setTimeout(() => {
      if (cancelled || !document.getElementById(READER_ID)) return;
      scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scanner
        .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 200, height: 200 } }, (text) => finish(text), () => {})
        .then(() => {
          if (cancelled) scanner?.stop().catch(() => {});
          else setCameraState('running');
        })
        .catch(() => !cancelled && setCameraState('error'));
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title} description="Apunta la cámara al código o ingrésalo manualmente.">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-950">
        <div id={READER_ID} className="absolute inset-0 [&>div]:!border-none [&_img]:hidden" />
        {/* Visor */}
        <div className="pointer-events-none absolute inset-[14%]">
          {['left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-2xl', 'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-2xl', 'left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-2xl', 'right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-2xl'].map((c) => (
            <span key={c} className={`absolute h-10 w-10 border-white ${c}`} />
          ))}
          <span className="absolute inset-x-2 h-0.5 animate-scan-line rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>
        {cameraState !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center text-zinc-400">
            {cameraState === 'error' ? <CameraOff size={28} /> : <Loader2 size={28} className="animate-spin" />}
            <p className="text-sm">{cameraState === 'error' ? 'Cámara no disponible — usa el ingreso manual o un atajo demo.' : 'Iniciando cámara…'}</p>
          </div>
        )}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) finish(manual.trim());
        }}
      >
        <div className="relative flex-1">
          <Keyboard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input pl-10 font-mono uppercase" placeholder={placeholder ?? 'Código manual'} value={manual} onChange={(e) => setManual(e.target.value)} />
        </div>
        <Button type="submit" className="h-11">
          Validar
        </Button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="caption mb-2 flex items-center gap-1">
            <Sparkles size={11} /> Simular escaneo (demo)
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button key={s.value} variant="outline" size="sm" onClick={() => finish(s.value)}>
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

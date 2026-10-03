import { useState } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK = '/img/paseo-edificio.jpg';

interface PhotoProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Posición del recorte (object-position). */
  position?: string;
  eager?: boolean;
}

/** Imagen con placeholder gris y respaldo a la foto del edificio si falla la carga. */
export function Photo({ src, alt, className, position, eager }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={!src || failed ? FALLBACK : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      style={position ? { objectPosition: position } : undefined}
      className={cn('bg-surface object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
    />
  );
}

/** Logo de tienda como ícono cuadrado redondeado. */
export function StoreLogo({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (!src) {
    return (
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[22%] bg-surface text-sm font-semibold text-muted-foreground', className)}>
        {name.slice(0, 1)}
      </span>
    );
  }
  return <img src={src} alt={`Logo de ${name}`} loading="lazy" className={cn('h-10 w-10 shrink-0 rounded-[22%] bg-white object-cover ring-1 ring-black/5', className)} />;
}

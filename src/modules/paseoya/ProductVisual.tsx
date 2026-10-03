import type { Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { Photo } from '@/components/ui/photo';

/** Foto del producto o, si no tiene, la foto real de la tienda donde se retira. */
export function ProductVisual({ product, className }: { product: Product; className?: string }) {
  const { getStore } = useApp();
  const store = getStore(product.storeId);
  return <Photo src={product.imageUrl ?? store?.bannerUrl} alt={product.name} className={className} />;
}

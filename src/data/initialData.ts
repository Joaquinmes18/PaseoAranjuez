import raw from '../../mockData.json';
import type { AppState, Order, Product, Reward, Store, User } from '../types';

/**
 * Semilla tipada basada en mockData.json.
 * Normaliza diferencias del JSON (órdenes de un solo producto, recompensas sin stock/vigencia).
 */
type RawOrder = (typeof raw.paseoAranjuez.orders)[number] & Partial<Order>;
type RawReward = (typeof raw.paseoAranjuez.rewardsCatalog)[number] & Partial<Reward>;

const normalizeOrder = (o: RawOrder): Order => ({
  orderId: o.orderId,
  userId: o.userId,
  userName: o.userName,
  storeId: o.storeId,
  storeName: o.storeName,
  items: o.items ?? [
    { productId: o.productId, productName: o.productName, quantity: 1, price: o.totalPrice },
  ],
  totalPrice: o.totalPrice,
  pointsToEarn: o.pointsToEarn,
  status: o.status as Order['status'],
  pickupPin: o.pickupPin,
  pickupQrCode: o.pickupQrCode,
  createdAt: o.createdAt ?? '2026-10-03T10:15:00Z',
});

const normalizeReward = (r: RawReward): Reward => ({
  id: r.id,
  costInPoints: r.costInPoints,
  title: r.title,
  description: r.description,
  // "PASEO" en el JSON = beneficio general del centro comercial
  storeId: r.storeId === 'PASEO' ? undefined : r.storeId,
  validUntil: r.validUntil ?? '2026-12-31',
  stock: r.stock ?? 100,
  imageUrl: r.imageUrl,
});

export function buildInitialState(): AppState {
  const users = structuredClone(raw.users) as User[];
  return {
    users,
    currentUserId: users.find((u) => u.role === 'client')?.id ?? users[0].id,
    stores: structuredClone(raw.paseoAranjuez.stores) as Store[],
    products: structuredClone(raw.paseoAranjuez.products) as Product[],
    rewardsCatalog: raw.paseoAranjuez.rewardsCatalog.map((r) => normalizeReward(r as RawReward)),
    orders: raw.paseoAranjuez.orders.map((o) => normalizeOrder(o as RawOrder)),
    transactions: [
      {
        id: 'TX-SEED',
        userId: 'USR-001',
        type: 'mint',
        amount: 500,
        reason: 'Bono de bienvenida Paseo Points',
        txHash: '0x9f3c1a7be2d4c58e0a6b71f2c3d9e84a5b6c7d8e9f0a1b2c3d4e5f60718293a4',
        onChain: false,
        timestamp: '2026-10-01T15:00:00Z',
      },
    ],
    coupons: [],
    cart: [],
  };
}

export const FLOOR_LABEL: Record<number, string> = {
  0: 'Planta Baja',
  1: 'Primer Piso',
  2: 'Segundo Piso',
  3: 'Tercer Piso',
  4: 'Cuarto Piso',
};
export const FLOOR_SHORT: Record<number, string> = { 0: 'PB', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' };
export const floorLabel = (f: number) => FLOOR_LABEL[f] ?? `Piso ${f}`;

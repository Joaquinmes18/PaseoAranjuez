export type UserRole = 'client' | 'merchant' | 'admin';

export interface User {
  id: string;
  name: string;
  qrCode: string;
  walletAddress: string;
  pointsBalance: number;
  role: UserRole;
  storeId?: string;
}

export type StoreCategory = 'Tecnología' | 'Gastronomía' | 'Moda' | 'Entretenimiento' | 'Servicios';

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  floor: number;
  locationDetail: string;
  ownerId: string;
  bannerUrl?: string;
  logoUrl?: string;
  schedule: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  pointsReward: number;
  stock: number;
  imageUrl?: string;
  category: string;
}

export interface Reward {
  id: string;
  costInPoints: number;
  title: string;
  description: string;
  storeId?: string;
  validUntil: string;
  stock: number;
  imageUrl?: string;
}

export type OrderStatus = 'Pendiente' | 'Listo para recoger' | 'Entregado' | 'Cancelado';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalPrice: number;
  pointsToEarn: number;
  status: OrderStatus;
  pickupPin: string;
  pickupQrCode: string;
  createdAt: string;
  deliveredAt?: string;
}

export type TxType = 'mint' | 'burn';

export interface PointsTransaction {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  reason: string;
  txHash: string;
  onChain: boolean;
  timestamp: string;
}

export type CouponStatus = 'Activo' | 'Usado';

export interface Coupon {
  couponId: string;
  code: string;
  rewardId: string;
  rewardTitle: string;
  storeId?: string;
  userId: string;
  status: CouponStatus;
  createdAt: string;
  usedAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface AppState {
  users: User[];
  currentUserId: string;
  stores: Store[];
  products: Product[];
  rewardsCatalog: Reward[];
  orders: Order[];
  transactions: PointsTransaction[];
  coupons: Coupon[];
  cart: CartItem[];
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

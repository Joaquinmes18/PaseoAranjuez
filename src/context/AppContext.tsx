import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ActionResult,
  AppState,
  Coupon,
  Order,
  PointsTransaction,
  Product,
  Store,
  User,
} from '../types';
import { buildInitialState } from '../data/initialData';
import { randomCode, randomPin } from '../lib/utils';
import { useWeb3 } from './Web3Context';

const STORAGE_KEY = 'paseo-aranjuez-superapp:v2';

export type Tab = 'home' | 'm-home' | 'paseoya' | 'points' | 'jarvis' | 'orders' | 'm-pickups' | 'm-points' | 'm-coupons';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export interface Celebration {
  amount: number;
  userName: string;
  reason: string;
  txHash: string;
  onChain: boolean;
}

interface AppContextValue {
  state: AppState;
  currentUser: User;
  currentStore: Store | undefined;
  // navegación / UI
  tab: Tab;
  setTab: (t: Tab) => void;
  focusedProductId: string | null;
  openProduct: (productId: string | null) => void;
  /** Ficha de una tienda del directorio real (id de paseoaranjuez.com). */
  focusedStoreId: number | null;
  openStore: (id: number | null) => void;
  paletteOpen: boolean;
  setPaletteOpen: (o: boolean) => void;
  /** Prompt pendiente para Jarvis (desde el dashboard o el command palette). */
  jarvisPrompt: string | null;
  askJarvis: (prompt: string) => void;
  consumeJarvisPrompt: () => void;
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  toasts: Toast[];
  notify: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  celebration: Celebration | null;
  clearCelebration: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // helpers
  getStore: (id: string) => Store | undefined;
  getProduct: (id: string) => Product | undefined;
  cartCount: number;
  // acciones demo
  switchRole: (userId: string) => void;
  resetDemo: () => void;
  // carrito
  addToCart: (productId: string, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  // negocio
  createOrder: () => ActionResult<Order[]>;
  deliverOrder: (codeOrPin: string, storeId?: string) => Promise<ActionResult<Order>>;
  awardPoints: (userId: string, amount: number, reason: string) => Promise<ActionResult<PointsTransaction>>;
  registerInStorePurchase: (userQr: string, amountBs: number) => Promise<ActionResult<PointsTransaction>>;
  redeemReward: (rewardId: string) => Promise<ActionResult<Coupon>>;
  validateCoupon: (code: string, storeId?: string) => ActionResult<Coupon>;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...buildInitialState(), ...JSON.parse(saved) };
  } catch {
    /* almacenamiento no disponible o corrupto → semilla */
  }
  return buildInitialState();
}

const defaultTabFor = (u: User): Tab => (u.role === 'merchant' ? 'm-home' : 'home');

export function AppProvider({ children }: { children: ReactNode }) {
  const web3 = useWeb3();
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const initialUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
  const [tab, setTab] = useState<Tab>(defaultTabFor(initialUser));
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [focusedStoreId, setFocusedStoreId] = useState<number | null>(null);
  const [jarvisPrompt, setJarvisPrompt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('paseo-dark');
      return v ? v === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Persistencia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Sincronización entre pestañas (ej. cliente en el celular y cajero en la laptop del mismo navegador)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue) as AppState;
        setState((s) => ({ ...incoming, currentUserId: s.currentUserId, cart: s.cart }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('paseo-dark', darkMode ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
  const currentStore = currentUser.storeId ? state.stores.find((s) => s.id === currentUser.storeId) : undefined;

  const getStore = useCallback((id: string) => stateRef.current.stores.find((s) => s.id === id), []);
  const getProduct = useCallback((id: string) => stateRef.current.products.find((p) => p.id === id), []);

  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  // ───────────── Demo ─────────────
  const switchRole = useCallback((userId: string) => {
    const u = stateRef.current.users.find((x) => x.id === userId);
    if (!u) return;
    setState((s) => ({ ...s, currentUserId: userId }));
    setTab(defaultTabFor(u));
    setCartOpen(false);
    setFocusedProductId(null);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildInitialState();
    setState(fresh);
    setTab('home');
    setCartOpen(false);
    setCelebration(null);
    notify({ kind: 'info', title: 'Datos de demo restablecidos' });
  }, [notify]);

  const openProduct = useCallback((productId: string | null) => {
    setFocusedProductId(productId);
    if (productId) setTab('paseoya');
  }, []);

  const openStore = useCallback((id: number | null) => {
    setFocusedStoreId(id);
    if (id !== null) setPaletteOpen(false);
  }, []);

  const askJarvis = useCallback((prompt: string) => {
    setJarvisPrompt(prompt);
    setPaletteOpen(false);
    setTab('jarvis');
  }, []);
  const consumeJarvisPrompt = useCallback(() => setJarvisPrompt(null), []);
  const clearCelebration = useCallback(() => setCelebration(null), []);

  // ───────────── Carrito ─────────────
  const addToCart = useCallback(
    (productId: string, qty = 1) => {
      const p = stateRef.current.products.find((x) => x.id === productId);
      if (!p) return;
      const inCart = stateRef.current.cart.find((c) => c.productId === productId)?.quantity ?? 0;
      if (inCart + qty > p.stock) {
        notify({ kind: 'error', title: 'Sin stock suficiente', message: `Solo quedan ${p.stock} unidades.` });
        return;
      }
      setState((s) => {
        const exists = s.cart.find((c) => c.productId === productId);
        const cart = exists
          ? s.cart.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + qty } : c))
          : [...s.cart, { productId, quantity: qty }];
        return { ...s, cart };
      });
      notify({ kind: 'success', title: 'Agregado al carrito', message: p.name });
    },
    [notify],
  );

  const updateCartQty = useCallback((productId: string, qty: number) => {
    setState((s) => {
      const p = s.products.find((x) => x.id === productId);
      const q = Math.min(qty, p?.stock ?? qty);
      return {
        ...s,
        cart: q <= 0 ? s.cart.filter((c) => c.productId !== productId) : s.cart.map((c) => (c.productId === productId ? { ...c, quantity: q } : c)),
      };
    });
  }, []);

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  // ───────────── Paseo Points ─────────────
  const awardPoints = useCallback(
    async (userId: string, amount: number, reason: string): Promise<ActionResult<PointsTransaction>> => {
      const user = stateRef.current.users.find((u) => u.id === userId);
      if (!user) return { ok: false, message: 'Usuario no encontrado' };
      if (amount <= 0) return { ok: false, message: 'El monto debe ser mayor a 0' };

      const { txHash, onChain } = await web3.relayMint(user.walletAddress, amount, reason);
      const tx: PointsTransaction = {
        id: `TX-${Date.now()}`,
        userId,
        type: 'mint',
        amount,
        reason,
        txHash,
        onChain,
        timestamp: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? { ...u, pointsBalance: u.pointsBalance + amount } : u)),
        transactions: [tx, ...s.transactions],
      }));
      setCelebration({ amount, userName: user.name, reason, txHash, onChain });
      return { ok: true, message: `+${amount} PaseoPoints acreditados a ${user.name}`, data: tx };
    },
    [web3],
  );

  const registerInStorePurchase = useCallback(
    async (userQr: string, amountBs: number) => {
      const code = userQr.trim().toUpperCase();
      const client = stateRef.current.users.find((u) => u.qrCode.toUpperCase() === code || u.id.toUpperCase() === code);
      if (!client || client.role !== 'client') return { ok: false, message: `QR de cliente no reconocido: ${userQr}` };
      const store = currentStore?.name ?? 'Paseo Aranjuez';
      // Tasa base: 1 Bs = 1 PaseoPoint
      return awardPoints(client.id, Math.floor(amountBs), `Compra presencial en ${store} (${amountBs} Bs)`);
    },
    [awardPoints, currentStore],
  );

  const redeemReward = useCallback(
    async (rewardId: string): Promise<ActionResult<Coupon>> => {
      const s0 = stateRef.current;
      const user = s0.users.find((u) => u.id === s0.currentUserId)!;
      const reward = s0.rewardsCatalog.find((r) => r.id === rewardId);
      if (!reward) return { ok: false, message: 'Recompensa no encontrada' };
      if (reward.stock <= 0) return { ok: false, message: 'Recompensa agotada' };
      if (user.pointsBalance < reward.costInPoints)
        return { ok: false, message: `Te faltan ${reward.costInPoints - user.pointsBalance} PaseoPoints` };

      // Reserva optimista del saldo para evitar doble canje mientras el relayer responde
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === user.id ? { ...u, pointsBalance: u.pointsBalance - reward.costInPoints } : u)),
      }));
      const { txHash, onChain } = await web3.relayBurn(user.walletAddress, reward.costInPoints, reward.id);

      const now = new Date().toISOString();
      const coupon: Coupon = {
        couponId: `CPN-${Date.now()}`,
        code: `CPN-${randomCode(5)}`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        storeId: reward.storeId,
        userId: user.id,
        status: 'Activo',
        createdAt: now,
      };
      const tx: PointsTransaction = {
        id: `TX-${Date.now()}`,
        userId: user.id,
        type: 'burn',
        amount: reward.costInPoints,
        reason: `Canje: ${reward.title}`,
        txHash,
        onChain,
        timestamp: now,
      };
      setState((s) => ({
        ...s,
        rewardsCatalog: s.rewardsCatalog.map((r) => (r.id === reward.id ? { ...r, stock: r.stock - 1 } : r)),
        coupons: [coupon, ...s.coupons],
        transactions: [tx, ...s.transactions],
      }));
      return { ok: true, message: `Cupón generado: ${reward.title}`, data: coupon };
    },
    [web3],
  );

  const validateCoupon = useCallback((code: string, storeId?: string): ActionResult<Coupon> => {
    const c = stateRef.current.coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    if (!c) return { ok: false, message: 'Cupón no encontrado' };
    if (c.status === 'Usado') return { ok: false, message: 'Este cupón ya fue utilizado' };
    if (storeId && c.storeId && c.storeId !== storeId) {
      const st = stateRef.current.stores.find((s) => s.id === c.storeId);
      return { ok: false, message: `Este cupón es válido solo en ${st?.name ?? c.storeId}` };
    }
    const used: Coupon = { ...c, status: 'Usado', usedAt: new Date().toISOString() };
    setState((s) => ({ ...s, coupons: s.coupons.map((x) => (x.couponId === c.couponId ? used : x)) }));
    return { ok: true, message: `Cupón válido: ${c.rewardTitle}`, data: used };
  }, []);

  // ───────────── PaseoYa ─────────────
  const createOrder = useCallback((): ActionResult<Order[]> => {
    const s0 = stateRef.current;
    const user = s0.users.find((u) => u.id === s0.currentUserId)!;
    if (s0.cart.length === 0) return { ok: false, message: 'El carrito está vacío' };

    for (const item of s0.cart) {
      const p = s0.products.find((x) => x.id === item.productId);
      if (!p || p.stock < item.quantity) return { ok: false, message: `Stock insuficiente: ${p?.name ?? item.productId}` };
    }

    // Una orden por tienda: cada local entrega lo suyo con su propio PIN/QR
    const byStore = new Map<string, typeof s0.cart>();
    for (const item of s0.cart) {
      const p = s0.products.find((x) => x.id === item.productId)!;
      byStore.set(p.storeId, [...(byStore.get(p.storeId) ?? []), item]);
    }

    let seq = s0.orders.reduce((m, o) => Math.max(m, Number(o.orderId.replace(/\D/g, '')) || 0), 100);
    const usedPins = new Set(s0.orders.filter((o) => o.status === 'Listo para recoger').map((o) => o.pickupPin));
    const now = new Date().toISOString();

    const newOrders: Order[] = [...byStore.entries()].map(([storeId, items]) => {
      const store = s0.stores.find((st) => st.id === storeId)!;
      const orderItems = items.map((i) => {
        const p = s0.products.find((x) => x.id === i.productId)!;
        return { productId: p.id, productName: p.name, quantity: i.quantity, price: p.price };
      });
      const pointsToEarn = items.reduce((sum, i) => sum + s0.products.find((x) => x.id === i.productId)!.pointsReward * i.quantity, 0);
      let pin = randomPin();
      while (usedPins.has(pin)) pin = randomPin();
      usedPins.add(pin);
      const orderId = `ORD-${++seq}`;
      return {
        orderId,
        userId: user.id,
        userName: user.name,
        storeId,
        storeName: store.name,
        items: orderItems,
        totalPrice: orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        pointsToEarn,
        status: 'Listo para recoger',
        pickupPin: pin,
        pickupQrCode: `ORDER-${orderId}-PIN-${pin}`,
        createdAt: now,
      };
    });

    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
        const c = s.cart.find((x) => x.productId === p.id);
        return c ? { ...p, stock: p.stock - c.quantity } : p;
      }),
      orders: [...newOrders, ...s.orders],
      cart: [],
    }));
    return { ok: true, message: `${newOrders.length} ticket(s) de retiro generados`, data: newOrders };
  }, []);

  const deliverOrder = useCallback(
    async (codeOrPin: string, storeId?: string): Promise<ActionResult<Order>> => {
      const code = codeOrPin.trim().toUpperCase();
      const { orders } = stateRef.current;
      let order: Order | undefined;
      if (code.startsWith('ORDER-')) {
        order = orders.find((o) => o.pickupQrCode.toUpperCase() === code);
      } else if (/^\d{4}$/.test(code)) {
        const candidates = orders.filter((o) => o.pickupPin === code && o.status === 'Listo para recoger');
        order = candidates.find((o) => !storeId || o.storeId === storeId) ?? candidates[0];
      } else {
        order = orders.find((o) => o.orderId.toUpperCase() === code);
      }

      if (!order) return { ok: false, message: 'PIN o QR inválido. Verifica el ticket del cliente.' };
      if (storeId && order.storeId !== storeId)
        return { ok: false, message: `Este pedido se retira en ${order.storeName}, no en este local.` };
      if (order.status === 'Entregado') return { ok: false, message: `El pedido ${order.orderId} ya fue entregado.` };
      if (order.status === 'Cancelado') return { ok: false, message: `El pedido ${order.orderId} está cancelado.` };

      const delivered: Order = { ...order, status: 'Entregado', deliveredAt: new Date().toISOString() };
      setState((s) => ({ ...s, orders: s.orders.map((o) => (o.orderId === order!.orderId ? delivered : o)) }));

      // Sinergia transversal PaseoYa → Paseo Points
      await awardPoints(order.userId, order.pointsToEarn, `Retiro PaseoYa ${order.orderId} en ${order.storeName}`);
      return { ok: true, message: `Pedido ${order.orderId} entregado a ${order.userName}`, data: delivered };
    },
    [awardPoints],
  );

  const cartCount = state.cart.reduce((n, c) => n + c.quantity, 0);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      currentUser,
      currentStore,
      tab,
      setTab,
      focusedProductId,
      openProduct,
      focusedStoreId,
      openStore,
      paletteOpen,
      setPaletteOpen,
      jarvisPrompt,
      askJarvis,
      consumeJarvisPrompt,
      cartOpen,
      setCartOpen,
      toasts,
      notify,
      dismissToast,
      celebration,
      clearCelebration,
      darkMode,
      toggleDarkMode: () => setDarkMode((d) => !d),
      getStore,
      getProduct,
      cartCount,
      switchRole,
      resetDemo,
      addToCart,
      updateCartQty,
      clearCart,
      createOrder,
      deliverOrder,
      awardPoints,
      registerInStorePurchase,
      redeemReward,
      validateCoupon,
    }),
    [
      state, currentUser, currentStore, tab, focusedProductId, openProduct, focusedStoreId, openStore, paletteOpen, jarvisPrompt, askJarvis,
      consumeJarvisPrompt, cartOpen, toasts, notify, dismissToast,
      celebration, clearCelebration, darkMode, getStore, getProduct, cartCount, switchRole, resetDemo, addToCart, updateCartQty,
      clearCart, createOrder, deliverOrder, awardPoints, registerInStorePurchase, redeemReward, validateCoupon,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

import { Bot, Gift, House, Package, QrCode, ShoppingBag, Ticket, type LucideIcon } from 'lucide-react';
import { useApp, type Tab } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface NavItem {
  tab: Tab;
  label: string;
  icon: LucideIcon;
}

export const CLIENT_NAV: NavItem[] = [
  { tab: 'home', label: 'Inicio', icon: House },
  { tab: 'paseoya', label: 'Tienda', icon: ShoppingBag },
  { tab: 'points', label: 'Puntos', icon: Gift },
  { tab: 'orders', label: 'Pedidos', icon: Package },
  { tab: 'jarvis', label: 'Jarvis', icon: Bot },
];

export const MERCHANT_NAV: NavItem[] = [
  { tab: 'm-home', label: 'Resumen', icon: House },
  { tab: 'm-pickups', label: 'Retiros', icon: Package },
  { tab: 'm-points', label: 'Puntos', icon: QrCode },
  { tab: 'm-coupons', label: 'Cupones', icon: Ticket },
];

function useNavItems() {
  const { currentUser, state } = useApp();
  const merchant = currentUser.role === 'merchant';
  const pending = state.orders.filter(
    (o) => o.status === 'Listo para recoger' && (merchant ? o.storeId === currentUser.storeId : o.userId === currentUser.id),
  ).length;
  return { items: merchant ? MERCHANT_NAV : CLIENT_NAV, pending, badgeTab: (merchant ? 'm-pickups' : 'orders') as Tab };
}

/** Enlaces de la barra global (desktop). */
export function NavLinks({ className }: { className?: string }) {
  const { tab, setTab } = useApp();
  const { items, pending, badgeTab } = useNavItems();
  return (
    <nav className={cn('items-center gap-7', className)}>
      {items.map(({ tab: t, label }) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={cn('relative text-[13px] transition-colors', tab === t ? 'text-foreground' : 'text-foreground/70 hover:text-foreground')}
        >
          {label}
          {t === badgeTab && pending > 0 && <span className="ml-1 text-link">{pending}</span>}
        </button>
      ))}
    </nav>
  );
}

/** Barra de pestañas de iOS (móvil). */
export function BottomNav() {
  const { tab, setTab } = useApp();
  const { items, pending, badgeTab } = useNavItems();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden">
      <div className="mx-auto flex max-w-md">
        {items.map(({ tab: t, label, icon: Icon }) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}
            >
              <Icon size={23} strokeWidth={active ? 2.1 : 1.6} />
              {label}
              {t === badgeTab && pending > 0 && (
                <span className="absolute left-1/2 top-1 ml-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-medium text-white">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PickupTicket } from './PickupTicket';

/** Mis pedidos: pases activos e historial. */
export function PickupOrderView() {
  const { state, currentUser, setTab } = useApp();
  const mine = state.orders.filter((o) => o.userId === currentUser.id);
  const active = mine.filter((o) => o.status === 'Listo para recoger' || o.status === 'Pendiente');
  const past = mine.filter((o) => o.status === 'Entregado' || o.status === 'Cancelado');

  return (
    <div className="wrap pb-20 pt-12">
      <h1 className="headline">Pedidos.</h1>
      <p className="subhead mt-2">
        {active.length > 0
          ? `${active.length === 1 ? 'Tienes un pedido listo' : `Tienes ${active.length} pedidos listos`} para retirar. Muestra el PIN o el código en caja.`
          : 'No tienes pedidos pendientes de retiro.'}
      </p>

      {mine.length === 0 && (
        <button className="link mt-4 text-[17px]" onClick={() => setTab('paseoya')}>
          Ir a la tienda <ChevronRight size={16} />
        </button>
      )}

      {active.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {active.map((o) => (
            <PickupTicket key={o.orderId} order={o} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="title-2">Historial</h2>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {past.map((o) => (
              <PickupTicket key={o.orderId} order={o} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

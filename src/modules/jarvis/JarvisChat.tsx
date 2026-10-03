import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DIRECTORY } from '@/data/directory';
import { floorLabel } from '@/data/initialData';
import { cn, formatBs } from '@/lib/utils';
import { Photo } from '@/components/ui/photo';
import { ProductVisual } from '@/modules/paseoya/ProductVisual';
import { activeProvider, askJarvis, type AISource, type ChatTurn } from './aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  productIds?: string[];
  storeIds?: number[];
  source?: AISource;
}

const HISTORY_KEY = 'paseo-jarvis-chat-v2';

const SUGGESTIONS = [
  'Quiero unos audífonos y luego tomarme un café',
  '¿Dónde queda Fossil?',
  'Busco un regalo de menos de 200 Bs',
  '¿Qué puedo canjear con mis puntos?',
];

const PROVIDER_LABEL: Record<AISource, string> = { gemini: 'Gemini', openai: 'OpenAI', local: 'motor local' };

/** Jarvis: conversación limpia, con tarjetas de producto y de tienda bajo cada respuesta. */
export function JarvisChat() {
  const { state, currentUser, addToCart, openProduct, openStore, getStore, jarvisPrompt, consumeJarvisPrompt } = useApp();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]');
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: content }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askJarvis([...history, { role: 'user', content }], {
        stores: state.stores,
        products: state.products,
        rewards: state.rewardsCatalog,
        user: currentUser,
        orders: state.orders,
      });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', text: reply.text, productIds: reply.productIds, storeIds: reply.storeIds, source: reply.source }]);
    } finally {
      setBusy(false);
    }
  };

  // Pregunta enviada desde otra pantalla (con guarda para el doble efecto de StrictMode)
  const consumedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!jarvisPrompt) {
      consumedRef.current = null;
      return;
    }
    if (consumedRef.current === jarvisPrompt) return;
    consumedRef.current = jarvisPrompt;
    consumeJarvisPrompt();
    send(jarvisPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jarvisPrompt]);

  const empty = messages.length === 0 && !busy;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px-64px)] max-w-[720px] flex-col px-4 pt-12 sm:px-6 md:min-h-[calc(100dvh-48px)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="headline">Jarvis.</h1>
          <p className="subhead mt-2">Pregunta por cualquier tienda, qué comer o tus PaseoPoints.</p>
        </div>
        {!empty && (
          <button className="link shrink-0 text-[15px]" onClick={() => setMessages([])}>
            Nueva conversación
          </button>
        )}
      </div>

      {empty ? (
        <div className="mt-10">
          <p className="caption mb-2">Prueba con</p>
          <div className="divide-y divide-border border-y border-border">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="flex w-full items-center justify-between py-4 text-left text-[17px] text-link">
                {s}
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 flex-1 space-y-8 pb-6">
          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[80%] rounded-[20px] bg-surface px-4 py-2.5 text-[17px]">{m.text}</p>
              </div>
            ) : (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <p className="whitespace-pre-line text-[17px] leading-relaxed">{m.text.replace(/\*\*/g, '')}</p>

                {!!m.productIds?.length && (
                  <div className="no-scrollbar -mx-4 mt-5 flex gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
                    {m.productIds.map((pid) => {
                      const p = state.products.find((x) => x.id === pid);
                      if (!p) return null;
                      const st = getStore(p.storeId);
                      return (
                        <div key={pid} className="tile w-60 shrink-0 border border-border">
                          <button onClick={() => openProduct(p.id)} className="block w-full text-left">
                            <ProductVisual product={p} className="aspect-[4/3] w-full" />
                            <div className="px-4 pt-3">
                              <p className="caption">
                                {st?.name} · {st && floorLabel(st.floor)}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug">{p.name}</p>
                              <p className="text-[14px] text-muted-foreground tabular">{formatBs(p.price)}</p>
                            </div>
                          </button>
                          <div className="flex items-center justify-between px-4 pb-4 pt-3 text-[14px]">
                            <button className="link" onClick={() => openProduct(p.id)}>
                              Ver <ChevronRight size={13} />
                            </button>
                            <button className="link font-medium" disabled={p.stock === 0} onClick={() => addToCart(p.id)}>
                              Agregar a la bolsa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!!m.storeIds?.length && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {m.storeIds.map((sid) => {
                      const s = DIRECTORY.find((x) => x.id === sid);
                      if (!s) return null;
                      return (
                        <button key={sid} onClick={() => openStore(s.id)} className="flex items-center gap-3 rounded-xl bg-surface p-2 pr-3 text-left">
                          <Photo src={s.image} alt={s.name} className="h-12 w-16 shrink-0 rounded-lg" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium">{s.name}</span>
                            <span className="block text-[13px] text-muted-foreground">{floorLabel(s.floor)}</span>
                          </span>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ),
          )}
          {busy && (
            <div className="flex gap-1.5 py-2" aria-label="Jarvis está escribiendo">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-muted-foreground/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] mt-auto bg-background pb-4 pt-3 md:bottom-0 md:pb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-full border border-input bg-background py-1.5 pl-5 pr-1.5 focus-within:border-primary"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta" className="h-9 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground" />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition disabled:bg-muted-foreground/30')}
            aria-label="Enviar"
          >
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="caption mt-2 text-center">Jarvis usa el directorio y el catálogo del Paseo · {PROVIDER_LABEL[activeProvider]}</p>
      </div>
    </div>
  );
}

import type { Order, Product, Reward, Store, User } from '@/types';
import { floorLabel } from '@/data/initialData';
import { DIRECTORY, groupOf, type DirectoryStore } from '@/data/directory';

/**
 * Jarvis Paseo — RAG por inyección de contexto.
 * Se inyectan en el system prompt: el directorio real de tiendas, los productos de PaseoYa,
 * los beneficios, el saldo y los pedidos del cliente.
 * Proveedores: Gemini → OpenAI → motor local (la demo nunca falla).
 */

export type AISource = 'gemini' | 'openai' | 'local';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface JarvisContext {
  stores: Store[];
  products: Product[];
  rewards: Reward[];
  user: User;
  orders: Order[];
}

export interface JarvisReply {
  text: string;
  productIds: string[];
  /** Ids del directorio real (paseoaranjuez.com). */
  storeIds: number[];
  source: AISource;
}

const GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-2.0-flash';
const OPENAI_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim();
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini';

export const activeProvider: AISource = GEMINI_KEY ? 'gemini' : OPENAI_KEY ? 'openai' : 'local';

// ───────────────────────── Prompt RAG ─────────────────────────

export function buildSystemPrompt(ctx: JarvisContext): string {
  const directory = DIRECTORY.map((s) => `${s.id}|${s.name}|${floorLabel(s.floor)}|${groupOf(s)}${s.categories.length ? ` (${s.categories.join(', ')})` : ''}`).join('\n');
  const pickupStores = ctx.stores.map((s) => ({ id: s.id, nombre: s.name, piso: floorLabel(s.floor), horario: s.schedule }));
  const products = ctx.products.map((p) => ({
    id: p.id,
    tiendaId: p.storeId,
    nombre: p.name,
    descripcion: p.description,
    precioBs: p.price,
    paseoPoints: p.pointsReward,
    stock: p.stock,
  }));
  const rewards = ctx.rewards.map((r) => ({ titulo: r.title, costoPuntos: r.costInPoints, descripcion: r.description }));
  const activeOrders = ctx.orders
    .filter((o) => o.userId === ctx.user.id && o.status === 'Listo para recoger')
    .map((o) => ({ pedido: o.orderId, tienda: o.storeName, pin: o.pickupPin }));

  return `Eres Jarvis, el asistente del centro comercial Paseo Aranjuez en Cochabamba, Bolivia.

DIRECTORIO DE TIENDAS (id|nombre|piso|rubro):
${directory}

TIENDAS CON RETIRO EN PASEOYA: ${JSON.stringify(pickupStores)}
PRODUCTOS DISPONIBLES PARA RETIRO: ${JSON.stringify(products)}
BENEFICIOS PASEOPOINTS: ${JSON.stringify(rewards)}
CLIENTE: ${ctx.user.name}, saldo ${ctx.user.pointsBalance} PaseoPoints. Pedidos listos para retirar: ${JSON.stringify(activeOrders)}

CÓMO RESPONDER:
- Responde en español, con un tono cercano y profesional, en 2 a 4 frases. No uses emojis ni signos de exclamación en exceso.
- Usa solo la información anterior. Si algo no está en el directorio, dilo y sugiere la alternativa más cercana.
- Indica siempre el piso de cada tienda que menciones.
- Si hay un producto de PaseoYa que encaje, menciona que puede pedirlo en línea y retirarlo hoy en el local (no hay envíos a domicilio) y que suma PaseoPoints (1 Bs = 1 punto).
- Al final de la respuesta agrega, sin explicarlas, etiquetas para la interfaz: [[PRODUCT:<id>]] por cada producto recomendado y [[STORE:<id>]] por cada tienda del directorio mencionada.`;
}

const PRODUCT_TAG = /\[\[PRODUCT:([A-Za-z0-9-]+)\]\]/g;
const STORE_TAG = /\[\[STORE:(\d+)\]\]/g;

function parseReply(raw: string, ctx: JarvisContext, source: AISource): JarvisReply {
  const productIds = [...new Set([...raw.matchAll(PRODUCT_TAG)].map((m) => m[1]))].filter((id) => ctx.products.some((p) => p.id === id));
  let storeIds = [...new Set([...raw.matchAll(STORE_TAG)].map((m) => Number(m[1])))].filter((id) => DIRECTORY.some((s) => s.id === id));
  const text = raw.replace(PRODUCT_TAG, '').replace(STORE_TAG, '').trim();
  // Si el modelo olvidó las etiquetas, detecta tiendas mencionadas por nombre
  if (storeIds.length === 0) storeIds = DIRECTORY.filter((s) => s.name.length > 3 && text.toLowerCase().includes(s.name.toLowerCase())).map((s) => s.id).slice(0, 4);
  return { text, productIds, storeIds, source };
}

const withTimeout = (ms: number) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
};

async function askGemini(history: ChatTurn[], system: string): Promise<string> {
  const t = withTimeout(15000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: t.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((h) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
    if (!text) throw new Error('Gemini: respuesta vacía');
    return text;
  } finally {
    t.done();
  }
}

async function askOpenAI(history: ChatTurn[], system: string): Promise<string> {
  const t = withTimeout(15000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      signal: t.signal,
      body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.5, max_tokens: 600, messages: [{ role: 'system', content: system }, ...history] }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenAI: respuesta vacía');
    return text;
  } finally {
    t.done();
  }
}

export async function askJarvis(history: ChatTurn[], ctx: JarvisContext): Promise<JarvisReply> {
  const system = buildSystemPrompt(ctx);
  const recent = history.slice(-10);
  if (GEMINI_KEY) {
    try {
      return parseReply(await askGemini(recent, system), ctx, 'gemini');
    } catch (e) {
      console.warn('[Jarvis] Gemini no disponible, probando siguiente proveedor', e);
    }
  }
  if (OPENAI_KEY) {
    try {
      return parseReply(await askOpenAI(recent, system), ctx, 'openai');
    } catch (e) {
      console.warn('[Jarvis] OpenAI no disponible, usando motor local', e);
    }
  }
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
  return localJarvis(history[history.length - 1]?.content ?? '', ctx);
}

// ───────────────────────── Motor local (respaldo sin API) ─────────────────────────

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const firstIndex = (text: string, words: string[]) => {
  const idx = words.map((w) => text.indexOf(w)).filter((i) => i >= 0);
  return idx.length ? Math.min(...idx) : -1;
};
const joinNames = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`);

/** Intenciones sobre productos de PaseoYa. */
const PRODUCT_INTENTS: Record<string, string[]> = {
  Tecnología: ['audifono', 'auricular', 'airpods', 'musica', 'tecnolog', 'celular', 'iphone', 'apple', 'cargador', 'bluetooth'],
  Gastronomía: ['hambre', 'comer', 'comida', 'cafe', 'desayun', 'merienda', 'almuerz', 'cena', 'antojo', 'postre', 'helado', 'sandwich', 'picada', 'costilla', 'canela', 'dulce', 'tomar'],
  Moda: ['gorra', 'zapatilla', 'deport', 'puma'],
};

/** Temas del directorio: palabra en la consulta → rubro de la tienda. */
const DIRECTORY_TOPICS: [RegExp, RegExp, string][] = [
  [/joya|joyer|anillo|collar|arete/, /joyer/, 'joyería'],
  [/reloj/, /reloj/, 'relojes'],
  [/zapat|calzado|tenis|sandalia/, /calzado|deportes/, 'calzado'],
  [/ropa|vestir|vestido|jean|polera|camisa|outfit|moda/, /ropa|jeans/, 'ropa'],
  [/lenceria|ropa interior/, /lencer|ropa interior/, 'lencería'],
  [/perfum|fragancia/, /perfum|fragrance/, 'perfumes'],
  [/maquill|cosmet|belleza|unas|manicure/, /cosm|maquill|makeup|nails|cuidado/, 'belleza'],
  [/juguete|nino|nina|bebe|infantil/, /jugueter|infantil|beb|kids|toys/, 'niños'],
  [/telefono|chip|plan movil|linea/, /telecom/, 'telefonía'],
  [/videojuego|consola|gamer|playstation|nintendo/, /juegos|game/, 'videojuegos'],
  [/lentes|anteojos|optica/, /optica|pauker/, 'óptica'],
  [/pizza/, /pizza/, 'pizza'],
  [/hamburguesa|burger/, /hamburguesa|burger/, 'hamburguesas'],
  [/cerveza|trago|coctel|bar\b|after/, /cerveza|coctel|trago|bier/, 'tragos'],
  [/pasta|italian/, /pasta|italiana/, 'pastas'],
  [/parrilla|asado|carne|churrasco/, /parrilla|carne|parrilleros/, 'carnes'],
  [/flor|ramo/, /flor/, 'flores'],
  [/gimnasio|fitness|suplemento/, /fitness/, 'fitness'],
];

const storeHay = (s: DirectoryStore) => norm(`${s.name} ${s.categories.join(' ')}`);
const storeLine = (s: Store) => `${s.name} (${floorLabel(s.floor)})`;

export function localJarvis(message: string, ctx: JarvisContext): JarvisReply {
  const q = norm(message);
  const available = ctx.products.filter((p) => p.stock > 0);
  const storeOf = (p: Product) => ctx.stores.find((s) => s.id === p.storeId)!;
  const dirFor = (s: Store) => DIRECTORY.find((d) => d.name.toLowerCase() === s.name.toLowerCase());
  const reply = (text: string, productIds: string[] = [], storeIds: number[] = []): JarvisReply => ({ text, productIds, storeIds, source: 'local' });

  // 1) Puntos y beneficios
  if (has(q, ['punto', 'paseopoint', 'canje', 'canjear', 'premio', 'beneficio', 'recompensa', 'estacionamiento', 'parqueo', 'saldo'])) {
    const sorted = [...ctx.rewards].sort((a, b) => a.costInPoints - b.costInPoints);
    const affordable = sorted.filter((r) => r.costInPoints <= ctx.user.pointsBalance);
    const next = sorted.find((r) => r.costInPoints > ctx.user.pointsBalance);
    let text = `Tienes ${ctx.user.pointsBalance.toLocaleString('es-BO')} PaseoPoints. `;
    text += affordable.length
      ? `Ya puedes canjear: ${affordable.map((r) => r.title).join('; ')}. `
      : 'Todavía no alcanzas ningún beneficio. ';
    if (next) text += `Para «${next.title}» te faltan ${(next.costInPoints - ctx.user.pointsBalance).toLocaleString('es-BO')} puntos. `;
    text += 'Puedes canjearlos desde la sección Puntos.';
    return reply(text);
  }

  // 2) Pedidos y retiro
  if (has(q, ['pedido', 'pin', 'retiro', 'retirar', 'recoger', 'delivery', 'envio', 'domicilio'])) {
    const active = ctx.orders.filter((o) => o.userId === ctx.user.id && o.status === 'Listo para recoger');
    const note = has(q, ['delivery', 'envio', 'domicilio']) ? 'PaseoYa no hace envíos: pides en línea y retiras en el local. ' : '';
    if (active.length === 0) return reply(`${note}No tienes pedidos pendientes. Cuando hagas uno, recibirás un PIN de cuatro dígitos para retirarlo.`);
    const lines = active.map((o) => {
      const st = ctx.stores.find((s) => s.id === o.storeId);
      return `${o.orderId} en ${st ? storeLine(st) : o.storeName}, con el PIN ${o.pickupPin}`;
    });
    const ids = active.map((o) => ctx.stores.find((s) => s.id === o.storeId)).map((s) => (s ? dirFor(s)?.id : undefined)).filter((x): x is number => !!x);
    return reply(`${note}Tienes ${active.length === 1 ? 'un pedido listo' : `${active.length} pedidos listos`}: ${lines.join('; ')}. Al retirarlo se acreditan tus PaseoPoints automáticamente.`, [], ids);
  }

  // 3) Horarios
  if (has(q, ['horario', 'que hora', 'abre', 'cierra', 'abierto', 'atienden'])) {
    return reply(`Las tiendas con retiro atienden así: ${ctx.stores.map((s) => `${s.name}, de ${s.schedule.replace(' - ', ' a ')}`).join('; ')}.`);
  }

  // 4) Tienda mencionada por nombre ("¿dónde queda Fossil?")
  const named = DIRECTORY.filter((s) => {
    const n = norm(s.name);
    return n.length > 3 && (q.includes(n) || n.split(/[\s,&-]+/).some((w) => w.length > 4 && q.includes(w)));
  });
  if (named.length && !has(q, ['quiero', 'busco', 'tengo'])) {
    const s = named[0];
    const linked = ctx.stores.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
    const prods = linked ? available.filter((p) => p.storeId === linked.id) : [];
    const others = DIRECTORY.filter((x) => x.floor === s.floor && x.id !== s.id).slice(0, 2);
    let text = s.floor === 0 ? `${s.name} está en la planta baja.` : `${s.name} está en el ${floorLabel(s.floor).toLowerCase()}.`;
    if (others.length) text += ` En el mismo nivel también encuentras ${joinNames(others.map((o) => o.name))}.`;
    if (prods.length) text += ' Además, tiene productos para pedir en línea y retirar hoy.';
    return reply(text, prods.map((p) => p.id), [s.id]);
  }

  // 5) Presupuesto
  const budgetMatch = q.match(/(?:menos de|hasta|maximo|presupuesto(?: de)?|con)\s*(?:bs\.?\s*)?(\d{2,5})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;
  const inBudget = (p: Product) => !budget || p.price <= budget;

  // 6) Productos por intención, en el orden mencionado ("audífonos y luego café")
  const intents = Object.entries(PRODUCT_INTENTS)
    .map(([cat, words]) => ({ cat, words: words.filter((w) => q.includes(w)), idx: firstIndex(q, words) }))
    .filter((i) => i.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  const picks: Product[] = [];
  for (const intent of intents) {
    const pool = available.filter((p) => p.category === intent.cat && inBudget(p) && !picks.includes(p));
    const scored = pool
      .map((p) => ({ p, score: intent.words.filter((w) => norm(`${p.name} ${p.description}`).includes(w)).length }))
      .sort((a, b) => b.score - a.score);
    if (scored.length && scored[0].score > 0) picks.push(scored[0].p);
    else picks.push(...pool.filter((p, i, arr) => arr.findIndex((x) => x.storeId === p.storeId) === i).slice(0, 3));
  }

  // 7) Tiendas del directorio por rubro
  const topic = DIRECTORY_TOPICS.find(([re]) => re.test(q));
  const topicStores = topic ? DIRECTORY.filter((s) => topic[1].test(storeHay(s))).slice(0, 4) : [];

  const isGift = has(q, ['regalo', 'regalar', 'sorpresa', 'cumple', 'aniversario']);
  if (isGift && picks.length === 0 && topicStores.length === 0) {
    const gifts = available.filter(inBudget).filter((p, i, arr) => arr.findIndex((x) => x.storeId === p.storeId) === i).slice(0, 3);
    const jewelry = DIRECTORY.filter((s) => /joyer|perfum|reloj/.test(storeHay(s))).slice(0, 3);
    const text =
      (gifts.length ? `Para un regalo${budget ? ` de hasta Bs ${budget}` : ''} puedes pedir ${joinNames(gifts.map((p) => `${p.name} en ${storeOf(p).name}`))} y retirar${gifts.length > 1 ? 'los' : 'lo'} hoy. ` : '') +
      `Si buscas algo más especial, ${joinNames(jewelry.map((s) => `${s.name} (${floorLabel(s.floor)})`))} tienen buenas opciones.`;
    return reply(text, gifts.map((p) => p.id), jewelry.map((s) => s.id));
  }

  if (picks.length) {
    const multi = intents.length > 1;
    const options = picks.map((p) => `${p.name} de ${storeLine(storeOf(p))}, Bs ${p.price}`);
    const parts = multi
      ? picks.map((p, i) => `${i === 0 ? 'Primero puedes pasar por' : 'Después, en'} ${storeLine(storeOf(p))}: ${p.name}, Bs ${p.price}.`)
      : [`Te recomiendo ${options.length > 1 ? `${options.slice(0, -1).join('; ')}; o ${options[options.length - 1]}` : options[0]}.`];
    const total = picks.reduce((s, p) => s + p.pointsReward, 0);
    const storeIds = [...new Set(picks.map((p) => dirFor(storeOf(p))?.id).filter((x): x is number => !!x)), ...topicStores.map((s) => s.id)];
    // En una ruta se compran todos; si son alternativas, no se suman los puntos
    const closing = multi
      ? `Puedes pedirlos ahora y retirarlos en cada local sin hacer fila; sumarías ${total.toLocaleString('es-BO')} PaseoPoints.`
      : picks.length > 1
        ? 'Cualquiera lo puedes pedir ahora y retirar en el local sin hacer fila, sumando un PaseoPoint por cada boliviano.'
        : `Puedes pedirlo ahora y retirarlo en el local sin hacer fila; sumarías ${total.toLocaleString('es-BO')} PaseoPoints.`;
    return reply(
      `${parts.join(' ')} ${closing}`,
      picks.map((p) => p.id),
      [...new Set(storeIds)].slice(0, 4),
    );
  }

  if (topicStores.length) {
    return reply(
      `Para ${topic![2]} te recomiendo ${joinNames(topicStores.map((s) => `${s.name} (${floorLabel(s.floor)})`))}.`,
      [],
      topicStores.map((s) => s.id),
    );
  }

  // 8) Ubicaciones generales
  if (has(q, ['donde', 'ubica', 'piso', 'mapa', 'como llego', 'llegar'])) {
    const counts = [0, 1, 2, 3, 4].map((f) => `${floorLabel(f).toLowerCase()} (${DIRECTORY.filter((s) => s.floor === f).length} tiendas)`);
    return reply(`El Paseo tiene cinco niveles: ${joinNames(counts)}. La mayoría de los restaurantes están en el tercer y cuarto piso. Dime qué tienda buscas y te digo dónde está.`);
  }

  // 9) Saludo
  if (has(q, ['hola', 'buenas', 'buen dia', 'que tal', 'ayuda', 'que puedes', 'quien eres'])) {
    return reply(
      `Hola, ${ctx.user.name.split(' ')[0]}. Puedo ayudarte a encontrar una tienda, recomendarte qué comer o comprar, y pedir productos para que los retires hoy. También te digo cuántos PaseoPoints tienes y qué puedes canjear.`,
    );
  }

  // 10) Respaldo
  const featured = available.slice(0, 3);
  return reply(
    `No encontré una respuesta exacta a eso. Puedes preguntarme por una tienda, por algo para comer o por tus PaseoPoints. Mientras tanto, esto es lo más pedido hoy.`,
    featured.map((p) => p.id),
  );
}

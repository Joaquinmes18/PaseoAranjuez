import raw from './paseoStores.json';

/**
 * Directorio real de tiendas de Paseo Aranjuez (fuente: paseoaranjuez.com/stores).
 * Imágenes descargadas en /public/img/stores para que la demo funcione sin conexión.
 */
export interface DirectoryStore {
  id: number;
  slug: string;
  name: string;
  floor: number;
  categories: string[];
  image: string | null;
  logo: string | null;
  gallery: string[];
  social: { facebook?: string; instagram?: string; whatsapp?: string; tiktok?: string };
}

export const DIRECTORY = raw as DirectoryStore[];

/** Agrupación legible para filtros y para el contexto de Jarvis. */
const GROUPS: [string, RegExp][] = [
  ['Gastronomía', /comida|carne|pizza|hamburguesa|helado|cafe|café|postre|pasta|jugos|cerveza|coctel|brocheta|churros|waffle|sandwich|pollo|dulce|parrilla|española|italiana|mariscos/i],
  ['Moda', /ropa|jeans|lencer|calzado|hombre|deportes|accesorios/i],
  ['Joyería y relojes', /joyer|reloj/i],
  ['Belleza', /cosm|perfum|cuidado|maquill|nails/i],
  ['Tecnología', /tecnolog|telecom|juegos/i],
  ['Niños', /jugueter|infantil|beb/i],
  ['Hogar y regalos', /hogar|artesan|flor/i],
  ['Óptica', /óptica|optica/i],
];

export function groupOf(store: DirectoryStore): string {
  const text = store.categories.join(' ');
  for (const [group, re] of GROUPS) if (re.test(text)) return group;
  if (store.floor >= 3) return 'Gastronomía';
  return 'Otros';
}

export const DIRECTORY_GROUPS = ['Todas', ...GROUPS.map(([g]) => g), 'Otros'].filter(
  (g, i, arr) => arr.indexOf(g) === i && (g === 'Todas' || DIRECTORY.some((s) => groupOf(s) === g)),
);

export const findDirectoryStore = (name: string) => {
  const n = name.toLowerCase();
  return DIRECTORY.find((s) => s.name.toLowerCase() === n || s.slug === n);
};

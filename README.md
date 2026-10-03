# Paseo Aranjuez SuperApp

Plataforma digital unificada para el centro comercial **Paseo Aranjuez** (Cochabamba, Bolivia) desarrollada para el Hackathon Paseo Aranjuez. Integra en una sola experiencia fluida y multi-rol los tres ejes estratégicos del centro comercial: fidelización Web3, asistencia por inteligencia artificial y comercio electrónico de retiro presencial.

---

## 🚀 Pilares y Módulos Principales

1. **💳 Paseo Points (Fidelización Web3)**
   - Programa de recompensas basado en tokens ERC-20 (`PaseoToken`) sobre la red **Polygon Amoy Testnet**.
   - Acumulación transparente de puntos al escanear facturas o realizar compras.
   - Catálogo de canje por cupones y beneficios exclusivos en locales del centro comercial.
   - Experiencia Web3 invisible (*Embedded Wallet / Relayer* simulado sin fricción de gas para el usuario).

2. **🤖 Jarvis Paseo (Asistente IA con RAG)**
   - Asistente conversacional contextual con soporte para **Google Gemini** y **OpenAI** (o motor RAG local de contingencia sin conexión a API).
   - Respuestas en lenguaje natural sobre ubicación de tiendas, horarios, servicios y recomendaciones cruzadas con productos de PaseoYa.

3. **🛍️ PaseoYa (Marketplace Click & Collect)**
   - Catálogo digital y carrito de compras con **retiro presencial obligatorio** en tienda física (modelo diseñado para impulsar el flujo peatonal en el mall).
   - Generación de tickets de recojo con código QR y PIN de seguridad para validación por parte del comerciante.
   - Disparo automático de tokens de fidelidad tras completar la entrega.

4. **👥 Experiencia Multi-Rol Integrada**
   - **Modo Cliente**: Navegación de tiendas, compras, consulta de balance de puntos y canjes.
   - **Modo Comercio**: Escáner de tickets de retiro, validación de cupones y acreditación de puntos a clientes.

---

## 🛠️ Tecnologías Clave

- **Frontend Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilos & Animaciones**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Web3 / Blockchain**: [Ethers.js v6](https://docs.ethers.org/v6/), Smart Contract ERC-20 en Solidity desplegable en Polygon Amoy
- **Inteligencia Artificial**: [Google Gemini API](https://ai.google.dev/) / [OpenAI API](https://platform.openai.com/) con fallback RAG local en memoria
- **Escaneo y Códigos QR**: [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) (lectura por cámara) y [`qrcode.react`](https://github.com/zpao/qrcode.react) (generación de tickets y credenciales)

---

## 📁 Estructura del Proyecto

```text
src/
├── components/          # Componentes reutilizables (layout, ui, modales, web3)
├── context/             # Estado global (AppContext y Web3Context)
├── contracts/           # Smart Contract Solidity y ABI (PaseoToken)
├── data/                # Semilla de datos, directorio y catálogo de tiendas
├── modules/
│   ├── directory/       # Ficha y directorio de comercios
│   ├── home/            # Vistas principales (Cliente y Comercio)
│   ├── jarvis/          # Chatbot y servicio de IA RAG
│   ├── paseoya/         # Catálogo, carrito y gestión de pedidos
│   └── points/          # Billetera de puntos, escáner y catálogo de recompensas
└── types/               # Definiciones e interfaces de TypeScript
```

---

## ⚡ Puesta en Marcha

### Prerrequisitos
- Node.js 18+ o [Bun](https://bun.sh/)

### 1. Clonar e instalar dependencias
```bash
git clone <url-del-repositorio>
cd PaseoAranjuez
npm install
# o con bun:
# bun install
```

### 2. Configurar variables de entorno (opcional)
Copia el archivo de ejemplo y completa las claves que requieras:
```bash
cp .env.example .env
```
> **Nota:** La aplicación es resiliente por diseño. Si no configuras claves de IA o RPC de Web3, funcionará automáticamente con el motor RAG local y simulación offline de transacciones.

### 3. Ejecutar en desarrollo
```bash
npm run dev
# o con bun:
# bun run dev
```

### 4. Scripts disponibles
- `npm run dev`: Inicia el servidor de desarrollo Vite.
- `npm run build`: Compila TypeScript y genera el bundle para producción.
- `npm run typecheck`: Comprobación estricta de tipos con `tsc`.
- `npm run preview`: Previsualización local del build de producción.

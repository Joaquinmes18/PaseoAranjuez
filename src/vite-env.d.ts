/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_POLYGON_AMOY_RPC?: string;
  readonly VITE_PASEO_TOKEN_ADDRESS?: string;
  readonly VITE_RELAYER_PRIVATE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

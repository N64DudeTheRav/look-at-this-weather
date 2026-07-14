/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string; // default: https://api-tropometrics.odspieg.nl
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

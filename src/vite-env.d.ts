/// <reference types="vite/client" />

import type { Injected } from "./inject";

declare global {
  interface Window {
    __WEB_MAID__INJECTION: Promise<Injected> | undefined;
  }
}

/// <reference types="vite/client" />

import type { Injected } from "./inject";

declare global {
  interface Window {
    __SCRAPER_EXTENSION__: Promise<Injected> | undefined;
  }
}

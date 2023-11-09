/// <reference types="vite/client" />

import type { Injected } from "./inject-script";

declare global {
  interface Window {
    __SCRAPER_EXTENSION__: Injected;
  }
}

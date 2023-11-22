import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { version } from "./package.json";

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        docs: "docs.html",
      },
    },
  },
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        // up to four numbers separated by dots
        version: `${major}.${minor}.${patch}.${label}`,
        version_name: version,
        name: "Scraper Extension",
        description: "Extension to scrape data from web pages in free form",
        icons: {
          "16": "public/icon16.png",
          "32": "public/icon32.png",
          "48": "public/icon48.png",
          "128": "public/icon128.png",
        },
        action: {
          default_title: "Scraper",
        },
        background: {
          service_worker: "src/background.ts",
          type: "module",
        },
        options_page: "options.html",
        optional_permissions: ["tabs"],
        permissions: ["storage", "activeTab", "scripting"],
        //@ts-expect-error wrong types
        optional_host_permissions: ["https://*/*", "http://*/*"],
        content_scripts: [
          {
            matches: ["https://*/*", "http://*/*"],
            js: ["src/inject/index.tsx"],
          },
        ],
        sandbox: {
          pages: ["sandbox.html"],
        },
        web_accessible_resources: [
          {
            resources: ["sandbox.html"],
            matches: ["<all_urls>"],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

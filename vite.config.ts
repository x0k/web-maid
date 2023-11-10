import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { crx } from "@crxjs/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        version: "1.0.0",
        name: "Scraper Extension",
        description: "Companion extension for the Scraper",
        action: {
          default_popup: "popup.html",
          default_icon: {
            "16": "images/icon-16.png",
            "32": "images/icon-32.png",
            "48": "images/icon-48.png",
            "128": "images/icon-128.png",
          },
        },
        // background: {
        //   service_worker: "src/background.ts",
        //   type: "module",
        // },
        options_page: "options.html",
        optional_permissions: ["tabs"],
        permissions: ["storage", "activeTab", "scripting"],
        host_permissions: ["https://*/*", "http://*/*"],
        content_scripts: [
          {
            matches: ["https://*/*", "http://*/*"],
            js: ["src/inject/index.ts"],
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
      "@": "/src",
    },
  },
});

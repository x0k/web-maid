import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/shared/styles.css";

import { DocsPage } from "./docs-page";

if (import.meta.env.MODE !== "production") {
  document.title = `[${import.meta.env.MODE}] ${document.title}`;
}

const root = document.getElementById("root")!;

const client = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <DocsPage />
    </QueryClientProvider>
  </React.StrictMode>
);

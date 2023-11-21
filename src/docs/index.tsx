import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Docs } from "@/shared/config/docs";
import "@/shared/styles.css";

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
    <div className="max-w-3xl mx-auto py-8">
      <QueryClientProvider client={client}>
        <Docs />
      </QueryClientProvider>
    </div>
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";

import { ErrorAlert } from "@/components/error-alert";

import { connectToSandbox, findAndBindIFrame } from "@/shared/sandbox/connect";
import { SandboxContext } from "@/shared/sandbox/react-hooks";
import "@/shared/styles.css";

import { sandboxIFrameId } from "./constants";
import { OptionsPage } from "./options";

const root = document.getElementById("root")!;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

connectToSandbox("sandbox.html", findAndBindIFrame(sandboxIFrameId))
  .then((sandbox) => {
    sandbox.start();
    return sandbox;
  })
  .then(
    (sandbox) => (
      <React.StrictMode>
        <CssBaseline />
        <SandboxContext.Provider value={sandbox}>
          <QueryClientProvider client={queryClient}>
            <OptionsPage />
          </QueryClientProvider>
        </SandboxContext.Provider>
        <SnackbarProvider
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        />
      </React.StrictMode>
    ),
    (error) => <ErrorAlert error={error} />
  )
  .then((content) => ReactDOM.createRoot(root).render(content));

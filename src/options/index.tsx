import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";

import { ErrorAlert } from "@/components/error-alert";

import { createSandbox, findAndBindIFrame } from "@/shared/sandbox";
import { SandboxContext } from "@/shared/react";

import { OptionsPage } from "./options";

const root = document.getElementById("root")!;

createSandbox("sandbox.html", findAndBindIFrame("sandbox"))
  .then(
    (sandbox) => (
      <React.StrictMode>
        <CssBaseline />
        <SandboxContext.Provider value={sandbox}>
          <OptionsPage />
        </SandboxContext.Provider>
        <SnackbarProvider />
      </React.StrictMode>
    ),
    (error) => <ErrorAlert error={error} />
  )
  .then((content) => ReactDOM.createRoot(root).render(content));

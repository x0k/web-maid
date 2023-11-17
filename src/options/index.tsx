import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { connectToSandbox, findAndBindIFrame } from "@/shared/sandbox/connect";
import { SandboxContext } from "@/shared/sandbox/react-hooks";
import { ErrorAlert } from "@/components/error-alert";

import { sandboxIFrameId } from "./constants";
import { OptionsPage } from "./options";

const root = document.getElementById("root")!;

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
          <OptionsPage />
        </SandboxContext.Provider>
        <SnackbarProvider
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        />
      </React.StrictMode>
    ),
    (error) => <ErrorAlert error={error} />
  )
  .then((content) => ReactDOM.createRoot(root).render(content));

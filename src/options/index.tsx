import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";

import { ErrorAlert } from "@/components/error-alert";

import { connectToSandbox, findAndBindIFrame } from "@/shared/sandbox/connect";
import { SandboxContext } from "@/shared/sandbox/context";

import { sandboxIFrameId } from "./constants";
import { OptionsPage } from "./options";

chrome.runtime.onMessage.addListener((msg) => {
  console.log(msg);
});

const root = document.getElementById("root")!;

connectToSandbox("sandbox.html", findAndBindIFrame(sandboxIFrameId))
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

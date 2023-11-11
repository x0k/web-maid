import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";

import { OptionsPage } from "./options";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CssBaseline />
    <OptionsPage />
    <SnackbarProvider />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from 'notistack';
import { CssBaseline } from "@mui/material";
// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';

import "./index.css";
import { App } from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CssBaseline />
    <App />
    <SnackbarProvider />
  </React.StrictMode>
);

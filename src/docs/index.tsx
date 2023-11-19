import React from "react";
import ReactDOM from "react-dom/client";

import { Docs } from "@/shared/config/docs";
import "@/shared/styles.css";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <div className="max-w-3xl mx-auto py-8">
      <Docs />
    </div>
  </React.StrictMode>
);

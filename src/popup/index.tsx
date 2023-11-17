import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";

import { connectToSandbox, findAndBindIFrame } from "@/shared/sandbox/connect";
import {
  getCurrentTab,
  loadLocalSettings,
  loadSyncSettings,
  makeIsomorphicConfigEval,
} from "@/shared/core";
import { makeExtensionActor, makeExtensionActorLogic } from "@/shared/actor";
import { FormShower } from "@/shared/form-shower";
import { ReactRootFactory } from "@/shared/react-root-factory";
import { Fetcher } from "@/shared/fetcher";
import {
  RemoteEvaluator,
  RemoteFormDataValidator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";
import { createOperatorResolver } from "@/shared/config/create";

import { contextId, sandboxIFrameId } from "./core";
import { Popup } from "./popup";

const initPromise = Promise.all([
  getCurrentTab(),
  loadSyncSettings(),
  loadLocalSettings(),
  connectToSandbox("sandbox.html", findAndBindIFrame(sandboxIFrameId)).then(
    (sandbox) => {
      const formShowerRoot = document.getElementById("form-shower-root");
      if (formShowerRoot === null) {
        throw new Error("No form shower root");
      }
      const logger = console;
      const fetcher = new Fetcher();
      const formShower = new FormShower(
        new ReactRootFactory({ current: formShowerRoot }),
        new RemoteFormDataValidator(sandboxIFrameId, sandbox)
      );
      const actor = makeExtensionActor(
        contextId,
        makeExtensionActorLogic(formShower, logger, fetcher)
      );
      sandbox.start();
      actor.start();
      return makeIsomorphicConfigEval({
        Create: (debug) =>
          createOperatorResolver({
            debug,
            logger,
            evaluator: new RemoteEvaluator(sandboxIFrameId, sandbox),
            rendered: new RemoteRenderer(sandboxIFrameId, sandbox),
            validator: new RemoteValidator(sandboxIFrameId, sandbox),
            fetcher,
            formShower,
          }),
      });
    }
  ),
] as const);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CssBaseline />
    <Popup initPromise={initPromise} />
  </React.StrictMode>
);

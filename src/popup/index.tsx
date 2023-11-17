import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";

import { IRemoteActor } from "@/lib/actor";
import { noop } from "@/lib/function/function";

import { connectToSandbox, findAndBindIFrame } from "@/shared/sandbox/connect";
import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  getCurrentTab,
  loadLocalSettings,
  loadSyncSettings,
  evalConfigInTab,
} from "@/shared/core";
import { makeExtensionActor, makeExtensionActorLogic } from "@/shared/actor";
import { FormShower } from "@/shared/form-shower";
import { ReactRootFactory } from "@/shared/react-root-factory";
import { Fetcher } from "@/shared/fetcher";
import { RemoteFormDataValidator } from "@/shared/sandbox/remote-impl";

import { contextId, sandboxIFrameId } from "./constants";
import { Popup } from "./popup";

function createActor(
  sandbox: IRemoteActor<SandboxAction, SandboxActionResults>
) {
  const formShowerRoot = document.getElementById("form-shower-root");
  if (formShowerRoot === null) {
    throw new Error("No form shower root");
  }
  const actor = makeExtensionActor(
    contextId,
    makeExtensionActorLogic(
      new FormShower(
        new ReactRootFactory({ current: formShowerRoot }),
        new RemoteFormDataValidator(sandboxIFrameId, sandbox)
      ),
      { log: noop },
      new Fetcher()
    )
  );
  return () => {
    sandbox.start();
    actor.start();
  };
}

const evalPromise = Promise.all([
  getCurrentTab(),
  loadSyncSettings(),
  loadLocalSettings(),
  connectToSandbox("sandbox.html", findAndBindIFrame(sandboxIFrameId)).then(
    createActor
  ),
] as const).then(([tab, sync, local, start]) => {
  if (tab === null) {
    return Promise.reject(new Error("No active tab"));
  }
  start();
  evalConfigInTab(tab.id, contextId, sync.config, local.secrets, false);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CssBaseline />
    <Popup />
  </React.StrictMode>
);

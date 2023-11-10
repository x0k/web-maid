import { IRemoteActor, RemoteActor } from "@/lib/actor";

import { Extension } from "@/shared/extension";
import { Action, ActionResults, ConfigRendered } from "@/shared/rpc";

let sandbox: IRemoteActor<Action, ActionResults>;
if (import.meta.env.DEV) {
  const { DevSandbox } = await import("@/shared/dev-sandbox");
  sandbox = new DevSandbox();
} else {
  const iFrame = document.getElementById("sandbox") as HTMLIFrameElement;
  iFrame.src = chrome.runtime.getURL("sandbox.html");
  const actor = new RemoteActor<Action, ActionResults, string>(iFrame);
  actor.listen(window);
  sandbox = actor;
}

const configRenderer = new ConfigRendered(sandbox);
export const api = new Extension(configRenderer);

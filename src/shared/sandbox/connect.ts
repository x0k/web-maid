import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { SandboxRemoteActor } from "@/lib/actors/sandbox";
import { stringifyError } from "@/lib/error";

import { SandboxAction, SandboxActionResults } from "./action";

export function createAndMountIFrame(iFrameId: string) {
  return (src: string) => {
    const iFrame = new DOMParser().parseFromString(
      `<iframe id="${iFrameId}" src="${src}" hidden></iframe>`,
      "text/html"
    ).body.firstElementChild as HTMLIFrameElement;
    window.document.body.append(iFrame);
    return iFrame;
  };
}

export function findAndBindIFrame(iFrameId: string) {
  return (src: string) => {
    const iFrame = window.document.getElementById(
      iFrameId
    ) as HTMLIFrameElement;
    iFrame.src = src;
    return iFrame;
  };
}

export async function connectToSandbox<T>(
  sandboxPath: string,
  iFrameFactory: (src: string) => HTMLIFrameElement
): Promise<IRemoteActor<SandboxAction<T>, SandboxActionResults<T>>> {
  if (import.meta.env.DEV) {
    return import("./dev").then(({ DevSandbox }) => new DevSandbox<T>());
  }
  const iFrame = iFrameFactory(chrome.runtime.getURL(sandboxPath));
  const sandbox = new SandboxRemoteActor<
    SandboxAction<T>,
    SandboxActionResults<T>,
    string
  >(makeRemoteActorLogic(stringifyError), iFrame);
  sandbox.listen(window);
  return sandbox;
}

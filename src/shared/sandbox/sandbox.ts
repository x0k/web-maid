import { IRemoteActor, RemoteActor } from "@/lib/actor";

import { Action, ActionResults } from "@/shared/rpc";

export function createAndMountIFrame(src: string) {
  const iFrame = new DOMParser().parseFromString(
    `<iframe src="${src}" hidden></iframe>`,
    "text/html"
  ).body.firstElementChild as HTMLIFrameElement;
  window.document.body.append(iFrame);
  return iFrame;
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

export async function createSandbox<T>(
  sandboxPath: string,
  iFrameFactory: (src: string) => HTMLIFrameElement
): Promise<IRemoteActor<Action<T>, ActionResults<T>>> {
  if (import.meta.env.DEV) {
    return import("./dev").then(({ DevSandbox }) => new DevSandbox<T>());
  }
  const iFrame = iFrameFactory(chrome.runtime.getURL(sandboxPath));
  const actor = new RemoteActor<Action<T>, ActionResults<T>, string>(iFrame);
  actor.listen(window);
  return actor;
}

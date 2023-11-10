import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor, RemoteActor } from "@/lib/actor";

import { configSchema } from "@/shared/config";
import { makeAppOperatorResolver } from "@/shared/operator";
import { Action, ActionResults, Evaluator, Renderer } from "@/shared/rpc";

let sandbox: IRemoteActor<Action, ActionResults>;
if (import.meta.env.DEV) {
  const { DevSandbox } = await import("@/shared/dev-sandbox");
  sandbox = new DevSandbox();
} else {
  const src = chrome.runtime.getURL("sandbox.html");
  const iFrame = new DOMParser().parseFromString(
    `<iframe src="${src}" hidden></iframe>`,
    "text/html"
  ).body.firstElementChild as HTMLIFrameElement;
  document.body.append(iFrame);
  const actor = new RemoteActor<Action, ActionResults, string>(iFrame);
  actor.listen(window);
  sandbox = actor;
}

const INJECTED = {
  parse,
  configSchema,
  traverseJsonLike,
  evalInScope,
  stringifyError,
  resolver: makeAppOperatorResolver(
    window,
    new Evaluator(sandbox),
    new Renderer(sandbox)
  ),
};

export type Injected = typeof INJECTED;

window.__SCRAPER_EXTENSION__ = INJECTED;

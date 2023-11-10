import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor, RemoteActor } from "@/lib/actor";

import { configSchema } from "@/shared/config";
import { makeAppOperatorResolver } from "@/shared/operator";
import { Action, ActionResults } from "@/shared/rpc";

import { Evaluator, Renderer } from "./impl";

function inject(sandbox: IRemoteActor<Action, ActionResults>) {
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
  window.__SCRAPER_EXTENSION__ = INJECTED;
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

if (import.meta.env.DEV) {
  import("@/shared/dev-sandbox")
    .then(({ DevSandbox }) => new DevSandbox())
    .then(inject);
} else {
  const src = chrome.runtime.getURL("sandbox.html");
  const iFrame = new DOMParser().parseFromString(
    `<iframe src="${src}" hidden></iframe>`,
    "text/html"
  ).body.firstElementChild as HTMLIFrameElement;
  document.body.append(iFrame);
  const actor = new RemoteActor<Action, ActionResults, string>(iFrame);
  actor.listen(window);
  inject(actor);
}

import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { RemoteActor } from "@/lib/actor";

import { configSchema } from "@/shared/config";
import { makeAppOperatorResolver } from "@/shared/operator";
import { Evaluator, Renderer } from "@/shared/rpc";

const src = chrome.runtime.getURL("sandbox.html");
const sandboxIFrame = new DOMParser().parseFromString(
  `<iframe src="${src}" hidden></iframe>`,
  "text/html"
).body.firstElementChild;
if (!(sandboxIFrame instanceof HTMLIFrameElement)) {
  throw new Error("Failed to create sandbox iframe");
}
document.body.append(sandboxIFrame);

const sandbox = new RemoteActor(sandboxIFrame);
sandbox.listen(window);

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

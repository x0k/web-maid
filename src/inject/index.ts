import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor } from "@/lib/actor";

import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";

import { Evaluator, Renderer, Validator } from "./impl";
import { compileOperatorFactories } from "./operator";

const iFrameId = "sandbox";

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  const INJECTED = {
    parse,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    resolver: makeOperatorResolver(
      makeComposedFactory(
        compileOperatorFactories({
          window,
          evaluator: new Evaluator(iFrameId, sandbox),
          rendered: new Renderer(iFrameId, sandbox),
          validator: new Validator(iFrameId, sandbox),
          // TODO: Implement form shower
          formShower: new Validator(iFrameId, sandbox),
        })
      )
    ),
    send: () => chrome.runtime.sendMessage({ type: "inject" }),
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame(iFrameId)).then(inject);

import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeDebugFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";
import { prepareForSending } from "@/lib/serialization";

import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";
import {
  ExtensionAction,
  ExtensionActionResults,
} from "@/shared/extension/action";

import {
  DebugLogger,
  Evaluator,
  FormShower,
  Renderer,
  Validator,
} from "./impl";
import { compileOperatorFactories } from "./operator";
import { iFrameId } from "./constants";

const extension = new ContextRemoteActor<
  ExtensionAction,
  ExtensionActionResults,
  string
>(makeRemoteActorLogic(stringifyError), {
  sendMessage(msg) {
    return chrome.runtime.sendMessage(prepareForSending(msg));
  },
});

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  const INJECTED = {
    parse,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    makeResolver: (contextId: string, debug: boolean) => {
      const composedFactory = makeComposedFactory(
        compileOperatorFactories({
          window,
          evaluator: new Evaluator(iFrameId, sandbox),
          rendered: new Renderer(iFrameId, sandbox),
          validator: new Validator(iFrameId, sandbox),
          formShower: new FormShower(contextId, extension),
        })
      );
      return makeOperatorResolver(
        debug
          ? makeDebugFactory(
              composedFactory,
              new DebugLogger(contextId, extension)
            )
          : composedFactory
      );
    },
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  sandbox.start();
  extension.start();
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame(iFrameId)).then(inject);

import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";

import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";
import {
  ExtensionAction,
  ExtensionActionResults,
} from "@/shared/extension/action";

import { Evaluator, FormShower, Renderer, Validator } from "./impl";
import { compileOperatorFactories } from "./operator";
import { iFrameId } from './constants';

const extension = new ContextRemoteActor<
  ExtensionAction,
  ExtensionActionResults,
  string
>(makeRemoteActorLogic(stringifyError), chrome.runtime);

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  const INJECTED = {
    parse,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    makeResolver: (contextId: string) => {
      return makeOperatorResolver(
        makeComposedFactory(
          compileOperatorFactories({
            window,
            evaluator: new Evaluator(iFrameId, sandbox),
            rendered: new Renderer(iFrameId, sandbox),
            validator: new Validator(iFrameId, sandbox),
            formShower: new FormShower(contextId, extension),
          })
        )
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

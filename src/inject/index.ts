import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";
import { prepareForSending } from "@/lib/serialization";

import { SandboxAction, SandboxActionResults } from "@/lib/sandbox/action";
import { createAndMountIFrame, connectToSandbox } from "@/lib/sandbox/connect";
import { ExtensionAction, ExtensionActionResults } from "@/shared/action";
import {
  RemoteLogger,
  Evaluator,
  RemoteFormShower,
  Renderer,
  Validator,
} from "@/shared/impl";
import { evalConfig } from "@/lib/config/eval";
import { compileOperatorFactories } from "@/lib/config/operator";
import { makeComposedFactory } from "@/lib/operator";

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
    evalConfig,
    compileOperatorFactories,
    makeComposedFactory,
    evaluator: new Evaluator(iFrameId, sandbox),
    rendered: new Renderer(iFrameId, sandbox),
    validator: new Validator(iFrameId, sandbox),
    makeRemote: (contextId: string) => ({
      formShower: new RemoteFormShower(contextId, extension),
      logger: new RemoteLogger(contextId, extension),
    }),
    stringifyError,
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  sandbox.start();
  extension.start();
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame(iFrameId)).then(inject);

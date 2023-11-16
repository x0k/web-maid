import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";
import { prepareForSerialization } from "@/lib/serialization";
import { SandboxAction, SandboxActionResults } from "@/lib/sandbox/action";
import { createAndMountIFrame, connectToSandbox } from "@/lib/sandbox/connect";
import { evalConfig } from "@/lib/config/eval";
import { createOperatorResolver } from "@/lib/config/create";
import { Json } from "@/lib/zod";

import { ExtensionAction, ExtensionActionResults } from "@/shared/action";
import {
  RemoteLogger,
  RemoteEvaluator,
  RemoteFormShower,
  RemoteRenderer,
  RemoteValidator,
  RemoteFetcher,
} from "@/shared/remote-impl";

import { iFrameId } from "./constants";

const extension = new ContextRemoteActor<
  ExtensionAction,
  ExtensionActionResults,
  string
>(makeRemoteActorLogic(stringifyError), {
  sendMessage(msg) {
    return chrome.runtime.sendMessage(prepareForSerialization(msg));
  },
});

interface InjectedConfigEvalOptions {
  config: string;
  secrets: Json;
  debug: boolean;
  contextId: string;
}

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  const evaluator = new RemoteEvaluator(iFrameId, sandbox);
  const rendered = new RemoteRenderer(iFrameId, sandbox);
  const validator = new RemoteValidator(iFrameId, sandbox);
  const INJECTED = {
    evalConfig: ({
      config,
      contextId,
      debug,
      secrets,
    }: InjectedConfigEvalOptions) => {
      const operatorResolver = createOperatorResolver({
        debug,
        evaluator,
        rendered,
        validator,
        formShower: new RemoteFormShower(contextId, extension),
        fetcher: new RemoteFetcher(contextId, extension),
        logger: new RemoteLogger(contextId, extension),
      });
      return evalConfig({
        config,
        secrets,
        operatorResolver: operatorResolver,
      });
    },
    stringifyError,
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  sandbox.start();
  extension.start();
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame(iFrameId)).then(inject);

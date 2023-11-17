import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";
import { prepareForSerialization } from "@/lib/serialization";

import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";
import { evalConfig } from "@/shared/config/eval";
import { createOperatorResolver } from "@/shared/config/create";
import { ExtensionAction, ExtensionActionResults } from "@/shared/action";
import {
  RemoteLogger,
  RemoteFormShower,
  RemoteFetcher,
} from "@/shared/remote-impl";
import {
  RemoteEvaluator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";

import { iFrameId } from "./constants";
import { Popup } from "./popup";
import { renderInShadowDom } from "./shadow-dom";

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
  secrets: string;
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
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "10px";
  container.style.right = "25px";
  container.style.zIndex = "9999999";
  renderInShadowDom(container, <Popup />);
  document.body.append(container);
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame(iFrameId)).then(inject);

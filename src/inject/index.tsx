import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextActor, ContextRemoteActor } from "@/lib/actors/context";
import { prepareForSerialization } from "@/lib/serialization";

import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";
import { createOperatorResolver } from "@/shared/config/create";
import { ExtensionAction, ExtensionActionResults } from "@/shared/action";
import {
  RemoteLogger,
  RemoteFormShower,
  RemoteFetcher,
} from "@/shared/remote-impl";
import {
  RemoteEvaluator,
  RemoteFormDataValidator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";
import { RemoteFetcher as BackgroundRemoteFetcher } from "@/shared/background/remote-impl";
import { makeIsomorphicConfigEval } from "@/shared/core";
import { FormShower } from "@/shared/form-shower";
import { ReactRootFactory } from "@/shared/react-root-factory";
import {
  BackgroundAction,
  BackgroundActionResults,
} from "@/shared/background/action";
import { BACKGROUND_ACTOR_ID } from "@/shared/background/core";
// import { TabAction, TabActionResults } from '@/shared/tab/action';

import { sandboxIFrameId } from "./constants";
import { Popup } from "./popup";
import { renderInShadowDom } from "./shadow-dom";

// const tab = new ContextActor<TabAction, TabActionResults, string>(

// )

const remoteLogic = makeRemoteActorLogic(stringifyError);
const messageSender = {
  sendMessage(msg: unknown) {
    return chrome.runtime.sendMessage(prepareForSerialization(msg));
  },
};

const extension = new ContextRemoteActor<
  ExtensionAction,
  ExtensionActionResults,
  string
>(remoteLogic, messageSender);

const background = new ContextRemoteActor<
  BackgroundAction,
  BackgroundActionResults,
  string
>(remoteLogic, messageSender);

interface InjectedConfigEvalOptions {
  config: string;
  secrets: string;
  debug: boolean;
  contextId?: string;
}

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  const evaluator = new RemoteEvaluator(sandboxIFrameId, sandbox);
  const rendered = new RemoteRenderer(sandboxIFrameId, sandbox);
  const validator = new RemoteValidator(sandboxIFrameId, sandbox);

  const formShowerRoot = document.createElement("div");
  const formShower = new FormShower(
    new ReactRootFactory({ current: formShowerRoot }),
    new RemoteFormDataValidator(sandboxIFrameId, sandbox)
  );
  const fetcher = new BackgroundRemoteFetcher(BACKGROUND_ACTOR_ID, background);

  const INJECTED = {
    evalConfig: ({
      config,
      contextId,
      debug,
      secrets,
    }: InjectedConfigEvalOptions) => {
      const evalConfig = makeIsomorphicConfigEval((debug) =>
        createOperatorResolver({
          debug,
          evaluator,
          rendered,
          validator,
          ...(contextId
            ? {
                formShower: new RemoteFormShower(contextId, extension),
                fetcher: new RemoteFetcher(contextId, extension),
                logger: new RemoteLogger(contextId, extension),
              }
            : {
                formShower,
                fetcher,
                logger: console,
              }),
        })
      );
      return evalConfig(debug, config, secrets, contextId);
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

connectToSandbox("sandbox.html", createAndMountIFrame(sandboxIFrameId)).then(
  inject
);

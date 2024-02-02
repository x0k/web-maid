import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { stringifyError } from "@/lib/error";
import { IRemoteActor, makeRemoteActorLogic } from "@/lib/actor";
import { ContextRemoteActor } from "@/lib/actors/context";
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
  RemoteOkShower,
} from "@/shared/remote-impl";
import {
  RemoteEvaluator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";
import { evalConfig, EvalConfigFile } from "@/shared/config/eval";

import { SANDBOX_IFRAME_ID } from "./constants";
import { Popup } from "./popup";
import { renderInShadowDom } from "./shadow-dom";

interface InjectedConfigEvalOptions {
  configFiles: EvalConfigFile[];
  secrets: string;
  debug: boolean;
  contextId: string;
}

function inject(sandbox: IRemoteActor<SandboxAction, SandboxActionResults>) {
  sandbox.start();

  const messageSender = {
    sendMessage(msg: unknown) {
      return chrome.runtime.sendMessage(prepareForSerialization(msg));
    },
  };
  const remoteLogic = makeRemoteActorLogic(stringifyError);

  const extension = new ContextRemoteActor<
    ExtensionAction,
    ExtensionActionResults,
    string
  >(remoteLogic, messageSender);
  extension.start();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "10px";
  container.style.right = "25px";
  container.style.zIndex = "9999999";
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  renderInShadowDom(
    container,
    <QueryClientProvider client={client}>
      <Popup sandbox={sandbox} />
    </QueryClientProvider>
  );
  document.body.append(container);
  // For tests
  const evaluator = new RemoteEvaluator(SANDBOX_IFRAME_ID, sandbox);
  const rendered = new RemoteRenderer(SANDBOX_IFRAME_ID, sandbox);
  const validator = new RemoteValidator(SANDBOX_IFRAME_ID, sandbox);
  return {
    evalConfig: ({
      configFiles,
      contextId,
      debug,
      secrets,
    }: InjectedConfigEvalOptions) =>
      evalConfig({
        configFiles,
        secrets,
        operatorResolver: createOperatorResolver({
          debug,
          evaluator,
          rendered,
          validator,
          formShower: new RemoteFormShower(contextId, extension),
          okShower: new RemoteOkShower(contextId, extension),
          fetcher: new RemoteFetcher(contextId, extension),
          logger: new RemoteLogger(contextId, extension),
        }),
      }),
    stringifyError,
  }
}

export type Injected = ReturnType<typeof inject>;

window.__SCRAPER_EXTENSION__ ??= connectToSandbox(
  "sandbox.html",
  createAndMountIFrame(SANDBOX_IFRAME_ID)
).then(inject, (error) => {
  console.error(error);
  window.__SCRAPER_EXTENSION__ = undefined;
  throw error;
});

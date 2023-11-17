import { useMemo } from "react";

import { AsyncFactory } from "@/lib/factory";
import { IActorLogic } from "@/lib/actor";
import { ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";
import { FetcherData } from "@/lib/operators/http";

import { ExtensionAction, ExtensionActionResults } from "./action";
import { makeExtensionActor, makeExtensionActorLogic } from "./actor";

export function useExtensionActorLogic(
  formShower: AsyncFactory<ShowFormData, unknown>,
  logger: ILogger,
  fetcher: AsyncFactory<FetcherData, unknown>
) {
  return useMemo(
    () => makeExtensionActorLogic(formShower, logger, fetcher),
    [formShower, logger, fetcher]
  );
}

export function useContextActor(
  contextId: string,
  actorLogic: IActorLogic<
    ExtensionAction,
    ExtensionActionResults,
    string,
    chrome.runtime.MessageSender
  >
) {
  return useMemo(
    () => makeExtensionActor(contextId, actorLogic),
    [contextId, actorLogic]
  );
}

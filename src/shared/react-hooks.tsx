import { useMemo } from "react";

import { AsyncFactory } from "@/lib/factory";
import { IActorLogic } from "@/lib/actor";
import { ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";
import { FetcherData } from "@/lib/operators/http";

import { ExtensionAction, ExtensionActionResults } from "./action";
import { makeExtensionActor, makeExtensionActorLogic } from "./actor";
import { DownloaderData } from '@/lib/operators/fs';

export function useExtensionActorLogic(
  formShower: AsyncFactory<ShowFormData, unknown>,
  okShower: AsyncFactory<string, void>,
  logger: ILogger,
  fetcher: AsyncFactory<FetcherData, unknown>,
  downlaoder: AsyncFactory<DownloaderData, void>
) {
  return useMemo(
    () => makeExtensionActorLogic(formShower, okShower, logger, fetcher, downlaoder),
    [formShower, okShower, logger, fetcher, downlaoder]
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

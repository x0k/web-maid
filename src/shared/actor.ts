import { IActorLogic, makeActorLogic } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";
import { FetcherData } from "@/lib/operators/http";
import { stringifyError } from "@/lib/error";
import { ContextActor } from "@/lib/actors/context";
import { noop } from "@/lib/function/function";
import { prepareForSerialization } from "@/lib/serialization";

import {
  ExtensionAction,
  ExtensionActionResults,
  ExtensionActionType,
} from "./action";
import { getAllTabs } from "./core";
import { DownloaderData } from '@/lib/operators/fs';

export function makeExtensionActorLogic(
  formShower: AsyncFactory<ShowFormData, unknown>,
  okShower: AsyncFactory<string, void>,
  logger: ILogger,
  fetcher: AsyncFactory<FetcherData, unknown>,
  downlaoder: AsyncFactory<DownloaderData, void>
) {
  return makeActorLogic<ExtensionAction, ExtensionActionResults, string, chrome.runtime.MessageSender>(
    {
      [ExtensionActionType.AppendLog]: ({ log }) => {
        logger.log(log);
      },
      [ExtensionActionType.ShowOk]: ({ message }) => okShower.Create(message),
      [ExtensionActionType.ShowFrom]: formShower.Create.bind(formShower),
      [ExtensionActionType.MakeRequest]: fetcher.Create.bind(fetcher),
      [ExtensionActionType.StartDownload]: ({
        content,
        filename,
        mimeType,
      }) => downlaoder.Create({ content, filename, type: mimeType }),
    },
    noop,
    stringifyError
  );
}

export function makeExtensionActor(
  contextId: string,
  actorLogic: IActorLogic<ExtensionAction, ExtensionActionResults, string, chrome.runtime.MessageSender>
) {
  return new ContextActor(contextId, actorLogic, {
    async sendMessage(message, tabId) {
      const msg = prepareForSerialization(message);
      if (tabId) {
        chrome.tabs.sendMessage(tabId, msg);
        return;
      }
      chrome.runtime.sendMessage(msg).catch(noop);
      // TODO: Is it really needed?
      const tabs = await getAllTabs();
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, msg).catch(noop);
      }
    },
  });
}

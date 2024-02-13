import { nanoid } from "nanoid";

import {
  ActorId,
  MessageType,
  makeActorLogic,
  makeRemoteActorLogic,
} from "@/lib/actor";
import { ContextActor, ContextRemoteActor } from "@/lib/actors/context";
import { stringifyError } from "@/lib/error";
import { noop } from "@/lib/function/function";
import { prepareForSerialization } from "@/lib/serialization";

import {
  getAllTabs,
  migrateSyncSettings,
} from "@/shared/core";
import {
  BackgroundAction,
  BackgroundActionResults,
  BackgroundActionType,
} from "@/shared/background/action";
import { BACKGROUND_ACTOR_ID } from "@/shared/background/core";
import { Fetcher } from "@/shared/fetcher";
import { Downloader } from '@/shared/downloader';
import {
  TabAction,
  TabActionResults,
  TabActionType,
} from "@/shared/tab/action";

// @ts-expect-error Script url import
import contentScript from '@/inject/index.tsx?script';

chrome.runtime.onInstalled.addListener(async function ({ reason }) {
  switch (reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
    case chrome.runtime.OnInstalledReason.UPDATE:
      await migrateSyncSettings();
  }
});

const fetcher = new Fetcher();
const downloader = new Downloader();

const TABS_TO_ACTORS_MAP = new Map<number, ActorId>();
const TABS_ACTORS_AWAITERS = new Map<number, (actorId: ActorId) => void>();

chrome.tabs.onRemoved.addListener((tabId) => {
  TABS_TO_ACTORS_MAP.delete(tabId);
  TABS_ACTORS_AWAITERS.delete(tabId);
});

const remoteTabActor = new ContextRemoteActor<
  TabAction,
  TabActionResults,
  string
>(makeRemoteActorLogic(stringifyError), {
  sendMessage(message) {
    return chrome.tabs.sendMessage(message.request.tabId, message);
  },
});

const runConfig = (tabId: number, actorId: ActorId) => {
  remoteTabActor.call({
      id: nanoid(),
      type: MessageType.Request,
      handlerId: actorId,
      request: {
        type: TabActionType.RunConfig,
        tabId,
      },
    });
}

chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!tabId) {
    return;
  }
  const actorId = TABS_TO_ACTORS_MAP.get(tabId);
  if (actorId) {
    runConfig(tabId, actorId);
  } else {
    TABS_ACTORS_AWAITERS.set(tabId, (actorId) => {
      runConfig(tabId, actorId);
    })
    chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScript]
    })
  }
});

const actor = new ContextActor<
  BackgroundAction,
  BackgroundActionResults,
  string
>(
  BACKGROUND_ACTOR_ID,
  makeActorLogic(
    {
      [BackgroundActionType.MakeRequest]: fetcher.Create.bind(fetcher),
      [BackgroundActionType.StartDownload]: ({
        content,
        filename,
        mimeType,
      }) => downloader.Create({
        content,
        filename,
        type: mimeType,
      }),
    },
    (msg, { tab }) => {
      if (tab && tab.id !== undefined) {
        TABS_TO_ACTORS_MAP.set(tab.id, msg.id);
        const awaiter = TABS_ACTORS_AWAITERS.get(tab.id);
        if (awaiter) {
          TABS_ACTORS_AWAITERS.delete(tab.id);
          awaiter(msg.id);
        }
      }
    },
    stringifyError
  ),
  {
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
  }
);

actor.start();
remoteTabActor.start();

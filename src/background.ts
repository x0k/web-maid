import { makeActorLogic } from "./lib/actor";
import { ContextActor } from "./lib/actors/context";
import { stringifyError } from "./lib/error";
import { noop } from "./lib/function/function";
import { prepareForSerialization } from "./lib/serialization";

import { getAllTabs } from "./shared/core";
import {
  BackgroundAction,
  BackgroundActionResults,
  BackgroundActionType,
} from "./shared/background/action";
import { BACKGROUND_ACTOR_ID } from "./shared/background/core";
import { Fetcher } from "./shared/fetcher";

const fetcher = new Fetcher();

const actor = new ContextActor<
  BackgroundAction,
  BackgroundActionResults,
  string
>(
  BACKGROUND_ACTOR_ID,
  makeActorLogic(
    {
      [BackgroundActionType.MakeRequest]: fetcher.Create.bind(fetcher),
    },
    noop,
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

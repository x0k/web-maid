import { RefObject, useMemo } from "react";
import { Root } from "react-dom/client";
import { ValidationData } from "@rjsf/utils";

import { AsyncFactory, Factory } from "@/lib/factory";
import { ContextActor } from "@/lib/actors/context";
import { IActorLogic, makeActorLogic } from "@/lib/actor";
import { noop } from "@/lib/function";
import { ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";
import { stringifyError } from "@/lib/error";
import { FormDataValidatorData } from "@/components/form";

import { getAllTabs } from "./core";
import {
  ExtensionAction,
  ExtensionActionResults,
  ExtensionActionType,
} from "./action";
import { RootFactory } from "./root-factory";
import { FormShower } from "./form-shower";

export function useRootFactory<E extends HTMLElement>(
  rootRef: RefObject<E>
): Factory<void, Root> {
  return useMemo(() => new RootFactory(rootRef), []);
}

export function useFormShower(
  rootFactory: Factory<void, Root>,
  asyncValidator: AsyncFactory<
    FormDataValidatorData<unknown>,
    ValidationData<unknown>
  >
): AsyncFactory<ShowFormData, unknown> {
  return useMemo(
    () => new FormShower(rootFactory, asyncValidator),
    [rootFactory, asyncValidator]
  );
}

export function useExtensionActorLogic(
  formShower: AsyncFactory<ShowFormData, unknown>,
  logger: ILogger
) {
  return useMemo(
    () =>
      makeActorLogic<ExtensionAction, ExtensionActionResults, string>(
        {
          [ExtensionActionType.AppendLog]: ({ log }) => {
            logger.log(log);
          },
          [ExtensionActionType.ShowFrom]: (config) => formShower.Create(config),
        },
        stringifyError
      ),
    [formShower, logger]
  );
}

export function useContextActor(
  contextId: string,
  actorLogic: IActorLogic<ExtensionAction, ExtensionActionResults, string>
) {
  return useMemo(
    () =>
      new ContextActor(contextId, actorLogic, {
        async sendMessage(message, tabId) {
          if (tabId) {
            chrome.tabs.sendMessage(tabId, message);
            return;
          }
          chrome.runtime.sendMessage(message).catch(noop);
          // TODO: Is it really needed?
          const tabs = await getAllTabs();
          for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, message).catch(noop);
          }
        },
      }),
    [contextId, actorLogic]
  );
}

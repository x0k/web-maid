import { RefObject, useMemo } from "react";
import { Root } from "react-dom/client";
import { ValidationData } from "@rjsf/utils";

import { AsyncFactory, Factory } from "@/lib/factory";
import { IActorLogic } from "@/lib/actor";
import { ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";
import { FormDataValidatorData } from "@/components/form";
import { FetcherData } from "@/lib/operators/http";

import { ExtensionAction, ExtensionActionResults } from "./action";
import { RootFactory } from "./root-factory";
import { FormShower } from "./form-shower";
import { makeExtensionActor, makeExtensionActorLogic } from "./actor";

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
  actorLogic: IActorLogic<ExtensionAction, ExtensionActionResults, string>
) {
  return useMemo(
    () => makeExtensionActor(contextId, actorLogic),
    [contextId, actorLogic]
  );
}

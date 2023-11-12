import { Request } from "@/lib/actor";

export enum ExtensionActionType {
  ShowFrom = "form::show",
}

export interface AbstractExtensionAction<T extends ExtensionActionType>
  extends Request<T> {}

export interface ShowFromAction
  extends AbstractExtensionAction<ExtensionActionType.ShowFrom> {
  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  data?: unknown;
  omitExtraData?: boolean;
}

export type ExtensionAction = ShowFromAction;

export interface ExtensionActionResults {
  [ExtensionActionType.ShowFrom]: unknown;
}

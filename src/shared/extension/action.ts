import { Request } from "@/lib/actor";

export enum ExtensionActionType {
  ShowFrom = "form::show",
  AppendLog = "log::append",
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

export interface AppendLogAction
  extends AbstractExtensionAction<ExtensionActionType.AppendLog> {
  log: unknown;
}

export type ExtensionAction = ShowFromAction | AppendLogAction;

export interface ExtensionActionResults {
  [ExtensionActionType.ShowFrom]: unknown;
  [ExtensionActionType.AppendLog]: void;
}

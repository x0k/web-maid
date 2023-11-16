import { Request } from "@/lib/actor";

export enum ExtensionActionType {
  ShowFrom = "form::show",
  AppendLog = "log::append",
  MakeRequest = "request::make",
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

export interface MakeRequestAction
  extends AbstractExtensionAction<ExtensionActionType.MakeRequest> {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  as?: "json" | "text";
}

export type ExtensionAction =
  | ShowFromAction
  | AppendLogAction
  | MakeRequestAction;

export interface ExtensionActionResults {
  [ExtensionActionType.ShowFrom]: unknown;
  [ExtensionActionType.AppendLog]: void;
  [ExtensionActionType.MakeRequest]: unknown;
}

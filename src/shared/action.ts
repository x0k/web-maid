import { Request } from "@/lib/actor";

export enum ExtensionActionType {
  ShowFrom = "form::show",
  ShowOk = "form::ok",
  AppendLog = "log::append",
  MakeRequest = "request::make",
  StartDownload = "download::start",
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

export interface ShowOkAction
  extends AbstractExtensionAction<ExtensionActionType.ShowOk> {
  message: string;
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
  as?: "json" | "text" | "dataUrl"
}

export interface StartDownloadAction
  extends AbstractExtensionAction<ExtensionActionType.StartDownload> {
  content: string;
  filename: string;
  mimeType: string;
}

export type ExtensionAction =
  | ShowFromAction
  | ShowOkAction
  | AppendLogAction
  | MakeRequestAction
  | StartDownloadAction;

export interface ExtensionActionResults {
  [ExtensionActionType.ShowFrom]: unknown;
  [ExtensionActionType.ShowOk]: void;
  [ExtensionActionType.AppendLog]: void;
  [ExtensionActionType.MakeRequest]: unknown;
  [ExtensionActionType.StartDownload]: void;
}

import { Request } from "@/lib/actor";

export enum BackgroundActionType {
  MakeRequest = "request::make",
  StartDownload = "download::start",
}

export interface AbstractBackgroundAction<T extends BackgroundActionType>
  extends Request<T> {}

export interface MakeRequestAction
  extends AbstractBackgroundAction<BackgroundActionType.MakeRequest> {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  as?: "json" | "text";
}

export interface StartDownloadAction
  extends AbstractBackgroundAction<BackgroundActionType.StartDownload> {
  content: string;
  filename: string;
  mimeType: string;
}

export type BackgroundAction = MakeRequestAction | StartDownloadAction

export interface BackgroundActionResults {
  [BackgroundActionType.MakeRequest]: unknown;
  [BackgroundActionType.StartDownload]: void;
}

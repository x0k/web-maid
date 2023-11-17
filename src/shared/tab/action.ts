import { Request } from "@/lib/actor";

export enum TabActionType {
  RunConfig = "config::run",
}

export interface AbstractTabAction<T extends TabActionType>
  extends Request<T> {}

export interface RunConfigAction
  extends AbstractTabAction<TabActionType.RunConfig> {}

export type TabAction = RunConfigAction;

export interface TabActionResults {
  [TabActionType.RunConfig]: void;
}

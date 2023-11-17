import {
  LocalSettings,
  SyncSettings,
  Tab,
  makeIsomorphicConfigEval,
} from "@/shared/core";

export const sandboxIFrameId = "sandbox";
export const contextId = "popup";

export type InitData = [
  Tab | null,
  SyncSettings,
  LocalSettings,
  ReturnType<typeof makeIsomorphicConfigEval>
];

export function makeConfigEval(debug: boolean) {
  return ([tab, sync, local, evalConfig]: InitData) =>
    evalConfig(debug, sync.config, local.secrets, contextId, tab?.id);
}

import { z } from "zod";

import { isObject } from "@/lib/guards";
import { evalConfig } from "@/lib/config/eval";
import { Factory } from "@/lib/factory";

import rawConfig from "./config.yml?raw";
import { injectedConfigEval } from "./injected-config-eval";

const localSettingsSchema = z.object({
  secrets: z.string(),
});

const partialLocalSettingsSchema = localSettingsSchema.partial();

const syncSettingsSchema = z.object({
  config: z.string(),
});

const partialSyncSettingsSchema = syncSettingsSchema.partial();

export interface LocalSettings {
  secrets: string;
}

export interface SyncSettings {
  config: string;
}

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof localSettingsSchema> = {
  secrets: "token: secret",
};

const DEFAULT_SYNC_SETTINGS: z.infer<typeof syncSettingsSchema> = {
  config: rawConfig,
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

const tabsSchema = z.array(tabSchema);

export type Tab = z.infer<typeof tabSchema>;

export async function loadSyncSettings(): Promise<SyncSettings> {
  const settings = await chrome.storage.sync.get(DEFAULT_SYNC_SETTINGS);
  return syncSettingsSchema.parse(settings);
}

export async function saveSyncSettings(settings: Partial<SyncSettings>) {
  const data = partialSyncSettingsSchema.parse(settings);
  await chrome.storage.sync.set(data);
}

export async function loadLocalSettings(): Promise<LocalSettings> {
  const settings = await chrome.storage.local.get(DEFAULT_LOCAL_SETTINGS);
  return localSettingsSchema.parse(settings);
}

export async function saveLocalSettings(settings: Partial<LocalSettings>) {
  const data = partialLocalSettingsSchema.parse(settings);
  await chrome.storage.local.set(data);
}

export function checkForTabsPermission(): Promise<boolean> {
  return chrome.permissions.contains({
    permissions: ["tabs"],
    origins: ["https://*/*", "http://*/*"],
  });
}

export function requestForTabsPermission(): Promise<boolean> {
  return chrome.permissions.request({
    permissions: ["tabs"],
    origins: ["https://*/*", "http://*/*"],
  });
}

export async function getAllTabs(): Promise<Tab[]> {
  return chrome.tabs.query({}).then(tabsSchema.parse);
}

export interface ConfigRenderedData {
  configTemplate: string;
  configData: LocalSettings;
}

async function evalConfigInTab(
  contextId: string,
  debug: boolean,
  config: string,
  tabId: number,
  secrets: string
): Promise<unknown> {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: injectedConfigEval,
    args: [contextId, config, secrets, debug],
  });
  if (
    isObject(result) &&
    "__error" in result &&
    typeof result.__error === "string"
  ) {
    throw new Error(result.__error);
  }
  return result;
}

export function makeIsomorphicConfigEval(
  operatorResolverFactory: Factory<boolean, (value: unknown) => unknown>
) {
  return async (
    contextId: string,
    debug: boolean,
    config: string,
    secrets: string,
    tabId?: number
  ) => {
    return tabId
      ? evalConfigInTab(contextId, debug, config, tabId, secrets)
      : evalConfig({
          config,
          secrets,
          operatorResolver: operatorResolverFactory.Create(debug),
        });
  };
}

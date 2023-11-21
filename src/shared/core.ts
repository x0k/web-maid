import { nanoid } from "nanoid";
import { z } from "zod";

import { isObject } from "@/lib/guards";
import { evalConfig } from "@/shared/config/eval";
import { FactoryFn } from "@/lib/factory";

import rawConfig from "./config.yml?raw";
import { injectedConfigEval } from "./injected-config-eval";

const serializedLocalSettingsSchema = z.object({
  secrets: z.string(),
});

const desizedLocalSettingsSchema = z
  .object({
    secrets: z.string(),
  })
  .partial();

const configFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  isRemovable: z.boolean(),
});

export type ConfigFile = z.infer<typeof configFileSchema>;

const configFilesSchema = z.array(configFileSchema);

const serializedSyncSettingsSchema = z.object({
  configFiles: z
    .string()
    .transform((v) => JSON.parse(v))
    .refine((v): v is ConfigFile[] => configFilesSchema.safeParse(v).success),
});

export type SyncSettings = z.infer<typeof serializedSyncSettingsSchema>;

const desiredSyncSettingsSchema = z
  .object({
    configFiles: configFilesSchema,
  })
  .partial()
  .transform(({ configFiles, ...rest }) => ({
    ...rest,
    configFiles: JSON.stringify(configFiles),
  }));

export interface LocalSettings {
  secrets: string;
}

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof desizedLocalSettingsSchema> = {
  secrets: "token: secret",
};

const DEFAULT_SYNC_SETTINGS: z.infer<typeof desiredSyncSettingsSchema> = {
  configFiles: JSON.stringify([
    {
      id: "main",
      name: "main",
      content: rawConfig,
      isRemovable: false,
    },
  ]),
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

export type Tab = z.infer<typeof tabSchema>;

const tabsSchema = z.array(tabSchema);

export async function loadSyncSettings(): Promise<SyncSettings> {
  const settings = await chrome.storage.sync.get(DEFAULT_SYNC_SETTINGS);
  return serializedSyncSettingsSchema.parse(settings);
}

export async function saveSyncSettings(settings: Partial<SyncSettings>) {
  const data = desiredSyncSettingsSchema.parse(settings);
  await chrome.storage.sync.set(data);
}

export async function createConfigFile(name: string, content: string) {
  const id = nanoid();
  const configFile: ConfigFile = {
    id,
    name,
    content,
    isRemovable: true,
  };
  const { configFiles } = await loadSyncSettings();
  await saveSyncSettings({
    configFiles: [...configFiles, configFile],
  });
  return configFile;
}

export async function deleteConfigFile(id: string) {
  const { configFiles } = await loadSyncSettings();
  await saveSyncSettings({
    configFiles: configFiles.filter(
      (file) => file.id !== id || !file.isRemovable
    ),
  });
}

export async function loadLocalSettings(): Promise<LocalSettings> {
  const settings = await chrome.storage.local.get(DEFAULT_LOCAL_SETTINGS);
  return serializedLocalSettingsSchema.parse(settings);
}

export async function saveLocalSettings(settings: Partial<LocalSettings>) {
  const data = desizedLocalSettingsSchema.parse(settings);
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

export async function getCurrentTab(): Promise<Tab | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab ? tabSchema.parse(tab) : null;
}

export interface ConfigRenderedData {
  configTemplate: string;
  configData: LocalSettings;
}

export async function evalConfigInTab(
  tabId: number,
  contextId: string,
  configFiles: ConfigFile[],
  secrets: string,
  debug: boolean
): Promise<unknown> {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: injectedConfigEval,
    args: [contextId, configFiles, secrets, debug],
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
  operatorResolverFactory: FactoryFn<boolean, (value: unknown) => unknown>
) {
  return async (
    debug: boolean,
    configFiles: ConfigFile[],
    secrets: string,
    contextId?: string,
    tabId?: number
  ) => {
    return tabId && contextId
      ? evalConfigInTab(tabId, contextId, configFiles, secrets, debug)
      : evalConfig({
          configFiles,
          secrets,
          operatorResolver: operatorResolverFactory(debug),
        });
  };
}

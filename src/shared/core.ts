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

export type LocalSettings = z.infer<typeof serializedLocalSettingsSchema>;

const desiredLocalSettingsSchema = z
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

const serializedSyncSettingsSchemaV1 = z.object({
  version: z.undefined(),
  configFiles: z
    .string()
    .transform((v) => JSON.parse(v))
    .refine(
      (v): v is z.infer<typeof configFilesSchema> =>
        configFilesSchema.safeParse(v).success
    ),
});

const configFilesAndVersionSchema = z.object({
  version: z.literal(2),
  configFiles: configFilesSchema,
});

const CONFIG_FILE_PREFIX = "$file-";

function configFileKey(configFileId: string): string {
  return `${CONFIG_FILE_PREFIX}${configFileId}`;
}

function isConfigFileKey(configFileKey: string): boolean {
  return configFileKey.startsWith(CONFIG_FILE_PREFIX);
}

const serializedSyncSettingsSchemaV2 = z
  .record(z.string())
  .transform((v) => {
    let version = 0;
    const configFiles: unknown[] = [];
    for (const [key, value] of Object.entries(v)) {
      if (key === "version") {
        version = Number(value);
        continue;
      }
      if (isConfigFileKey(key)) {
        configFiles.push(JSON.parse(value));
      }
    }
    return { version, configFiles };
  })
  .refine(
    (v): v is z.infer<typeof configFilesAndVersionSchema> =>
      configFilesAndVersionSchema.safeParse(v).success
  );

export type SyncSettings = z.infer<typeof serializedSyncSettingsSchemaV2>;

function parseSyncSettings(settings: Record<string, unknown>): SyncSettings {
  console.log(settings);
  switch (settings.version) {
    case "2":
      return serializedSyncSettingsSchemaV2.parse(settings);
    case undefined: {
      const { configFiles } = serializedSyncSettingsSchemaV1.parse(settings);
      return {
        version: 2,
        configFiles: configFiles,
      };
    }
    default:
      throw new Error(`Unsupported sync settings version: ${settings.version}`);
  }
}

const desiredSyncSettingsSchema = z
  .object({
    version: z.literal(2),
    configFiles: configFilesSchema,
  })
  .partial()
  .transform(({ version = 2, configFiles = [] }) => {
    const base: { version: string } & Record<string, string> = {
      version: String(version),
    };
    for (const file of configFiles) {
      base[configFileKey(file.id)] = JSON.stringify(file);
    }
    return base;
  });

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof desiredLocalSettingsSchema> = {
  secrets: "token: secret",
};

// desiredSyncSettingsSchemaV1
const DEFAULT_SYNC_SETTINGS = {
  version: "1",
  configFiles: [
    JSON.stringify({
      id: "main",
      name: "main",
      content: rawConfig,
      isRemovable: false,
    }),
  ],
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

export type Tab = z.infer<typeof tabSchema>;

const tabsSchema = z.array(tabSchema);

export async function loadSyncSettings(): Promise<SyncSettings> {
  const settings = await chrome.storage.sync.get(null);
  return parseSyncSettings({ ...DEFAULT_SYNC_SETTINGS, ...settings });
}

export async function saveSyncSettings(settings: Partial<SyncSettings>) {
  const data = desiredSyncSettingsSchema.parse(settings);
  await chrome.storage.sync.set(data);
}

export async function createConfigFile(name: string, content: string) {
  const { configFiles } = await loadSyncSettings();
  if (configFiles.some((file) => file.name === name)) {
    throw new Error(`Config file with name "${name}" already exists`);
  }
  const id = nanoid();
  const configFile: ConfigFile = {
    id,
    name,
    content,
    isRemovable: true,
  };
  await chrome.storage.sync.set({
    [configFileKey(configFile.id)]: JSON.stringify(configFile),
  });
  return configFile;
}

export async function deleteConfigFile(id: string) {
  await chrome.storage.sync.remove(configFileKey(id));
}

export async function loadLocalSettings(): Promise<LocalSettings> {
  const settings = await chrome.storage.local.get(DEFAULT_LOCAL_SETTINGS);
  return serializedLocalSettingsSchema.parse(settings);
}

export async function saveLocalSettings(settings: Partial<LocalSettings>) {
  const data = desiredLocalSettingsSchema.parse(settings);
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

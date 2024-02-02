import { nanoid } from "nanoid";
import { z } from "zod";
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

import { isObject } from "@/lib/guards";
import { evalConfig } from "@/shared/config/eval";
import { FactoryFn } from "@/lib/factory";

// @ts-expect-error Script url import
import contentScript from "@/inject/index.tsx?script";

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
  version: z.literal(1).default(1),
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

const VERSION_KEY = "version";
const CONFIG_FILES_ORDER_KEY = "configFilesOrder";
const CONFIG_FILE_PREFIX = "$file-";

function configFileKey(configFileId: string): string {
  return `${CONFIG_FILE_PREFIX}${configFileId}`;
}

function isConfigFileKey(configFileKey: string): boolean {
  return configFileKey.startsWith(CONFIG_FILE_PREFIX);
}

function configFileId(configFileKey: string): string {
  return configFileKey.slice(CONFIG_FILE_PREFIX.length);
}

const serializedSyncSettingsSchemaV2 = z
  .record(z.string())
  .transform((v) => {
    let version = 0;
    let configFiles: string[] = [];
    const files: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(v)) {
      if (key === VERSION_KEY) {
        version = Number(value);
        continue;
      }
      if (key === CONFIG_FILES_ORDER_KEY) {
        configFiles = JSON.parse(value);
        continue;
      }
      if (isConfigFileKey(key)) {
        files[configFileId(key)] = JSON.parse(decompressFromUTF16(value));
      }
    }
    return { version, configFiles: configFiles.map((file) => files[file]) };
  })
  .refine(
    (v): v is z.infer<typeof configFilesAndVersionSchema> =>
      configFilesAndVersionSchema.safeParse(v).success
  );

type SyncSettingsV1 = z.infer<typeof serializedSyncSettingsSchemaV1>;
type SyncSettingsV2 = z.infer<typeof serializedSyncSettingsSchemaV2>;
type SyncSettingsUnion = SyncSettingsV1 | SyncSettingsV2;

export type SyncSettings = SyncSettingsV2;

const LATEST_SYNC_SETTINGS_VERSION = 2;

const desiredSyncSettingsSchema = z
  .object({
    version: z.literal(2),
    configFiles: configFilesSchema,
  })
  .partial()
  .transform(({ version = 2, configFiles = [] }) => {
    const files: Record<string, string> = {};
    const filesOrder: string[] = [];
    for (const file of configFiles) {
      filesOrder.push(file.id);
      files[configFileKey(file.id)] = compressToUTF16(JSON.stringify(file));
    }
    return {
      ...files,
      [VERSION_KEY]: String(version),
      [CONFIG_FILES_ORDER_KEY]: JSON.stringify(filesOrder),
    };
  });

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof desiredLocalSettingsSchema> = {
  secrets: "token: secret",
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  version: 2,
  configFiles: [
    {
      id: "main",
      name: "main",
      content: rawConfig,
      isRemovable: false,
    },
  ],
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

export type Tab = z.infer<typeof tabSchema>;

const tabsSchema = z.array(tabSchema);

function parseSettings(settings: Record<string, unknown>): SyncSettingsUnion {
  switch (settings[VERSION_KEY]) {
    case "2":
      return serializedSyncSettingsSchemaV2.parse(settings);
    default:
      return serializedSyncSettingsSchemaV1.parse(settings);
  }
}

const migrations = [
  {
    version: 2,
    migrate(settings: SyncSettingsV1): SyncSettingsV2 {
      return {
        version: 2,
        configFiles: settings.configFiles,
      };
    },
  },
];

export async function migrateSyncSettings(): Promise<void> {
  const settings = await chrome.storage.sync.get(null);
  if (Object.keys(settings).length === 0) {
    await saveSyncSettings(DEFAULT_SYNC_SETTINGS);
    return;
  }
  let parsedSettings = parseSettings(settings);
  if (parsedSettings.version === LATEST_SYNC_SETTINGS_VERSION) {
    return;
  }
  for (const migration of migrations) {
    if (parsedSettings.version < migration.version) {
      parsedSettings = migration.migrate(parsedSettings as never);
    }
  }
  await chrome.storage.sync.clear();
  await saveSyncSettings(parsedSettings as SyncSettings);
}

export async function loadSyncSettings(): Promise<SyncSettings> {
  const settings = await chrome.storage.sync.get(null);
  return serializedSyncSettingsSchemaV2.parse(settings);
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
    [CONFIG_FILES_ORDER_KEY]: JSON.stringify(
      configFiles.map((file) => file.id).concat(id)
    ),
    [configFileKey(configFile.id)]: compressToUTF16(JSON.stringify(configFile)),
  });
  return configFile;
}

export async function deleteConfigFile(id: string) {
  const { configFiles } = await loadSyncSettings();
  if (!configFiles.some((file) => file.id === id)) {
    throw new Error(`Config file with id "${id}" does not exist`);
  }
  await chrome.storage.sync.set({
    [CONFIG_FILES_ORDER_KEY]: JSON.stringify(
      configFiles.filter((file) => file.id !== id).map((file) => file.id)
    ),
  });
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
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [contentScript],
  });
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

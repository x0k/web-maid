import { z } from "zod";

import { Json } from "@/lib/zod";
import { isObject } from "@/lib/guards";

import rawConfig from "./config.yml?raw";

const localSettingsSchema = z.object({
  secrets: z.string(),
});

const partialLocalSettingsSchema = localSettingsSchema.partial();

const syncSettingsSchema = z.object({
  config: z.string(),
  secretsSchema: z.string(),
});

const partialSyncSettingsSchema = syncSettingsSchema.partial();

export interface LocalSettings {
  secrets: Json;
}

export interface SyncSettings {
  config: string;
  secretsSchema: string;
}

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof localSettingsSchema> = {
  secrets: JSON.stringify({ token: "" }),
};

const DEFAULT_SYNC_SETTINGS: z.infer<typeof syncSettingsSchema> = {
  config: rawConfig,
  secretsSchema: `type: object
properties:
  token:
    type: string
required:
  - token
`,
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

const tabsSchema = z.array(tabSchema);

export type Tab = z.infer<typeof tabSchema>;

async function evalOperator(contextId: string, config: string, secrets: Json) {
  const { parse, traverseJsonLike, evalInScope, stringifyError, makeResolver } =
    window.__SCRAPER_EXTENSION__ ?? {
      stringifyError: String,
    };
  try {
    const configData = parse(config);
    return await evalInScope(
      traverseJsonLike(makeResolver(contextId), configData),
      {
        functions: {},
        constants: {},
        context: secrets,
      }
    );
  } catch (error) {
    return {
      __error: stringifyError(error),
    };
  }
}

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
  const { secrets, ...rest } = localSettingsSchema.parse(settings);
  return {
    ...rest,
    secrets: JSON.parse(secrets),
  };
}

export async function saveLocalSettings({
  secrets,
  ...rest
}: Partial<LocalSettings>) {
  const data = partialLocalSettingsSchema.parse({
    ...rest,
    secrets: JSON.stringify(secrets),
  });
  await chrome.storage.local.set(data);
}

export async function getAllTabs(): Promise<Tab[]> {
  return chrome.tabs.query({}).then(tabsSchema.parse);
}

export interface ConfigRenderedData {
  configTemplate: string;
  configData: LocalSettings;
}

export async function evalForTab(
  contextId: string,
  tabId: number,
  config: string
): Promise<unknown> {
  const localConfig = await loadLocalSettings();
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: evalOperator,
    args: [contextId, config, localConfig.secrets],
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

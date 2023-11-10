import { z } from "zod";
import { JSONSchema7 } from "json-schema";

import { Json } from "@/lib/zod";

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
  secretsSchema: JSONSchema7;
}

const DEFAULT_LOCAL_SETTINGS: z.infer<typeof localSettingsSchema> = {
  secrets: JSON.stringify({ token: "" }),
};

const DEFAULT_SYNC_SETTINGS: z.infer<typeof syncSettingsSchema> = {
  config: rawConfig,
  secretsSchema: JSON.stringify({
    type: "object",
    properties: {
      token: { type: "string" },
    },
    required: ["token"],
  }),
};

const tabSchema = z.object({
  id: z.number(),
  title: z.string().default("Untitled"),
  favIconUrl: z.string().optional(),
});

const tabsSchema = z.array(tabSchema);

export type Tab = z.infer<typeof tabSchema>;

const evalResultSchema = z.object({
  endpoint: z.string(),
  value: z.unknown(),
  schema: z.record(z.unknown()).optional(),
  uiSchema: z.record(z.unknown()).optional(),
});

export type EvalResult = z.infer<typeof evalResultSchema>;

async function evalOperator(config: string, secrets: Json) {
  const {
    parse,
    configSchema,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    resolver,
  } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String,
  };
  try {
    if (config.trim() === "") {
      throw new Error("No config");
    }
    const configData = parse(config);
    const value = await evalInScope(traverseJsonLike(resolver, configData), {
      functions: {},
      constants: {},
      context: secrets,
    });
    return configSchema.parse(value);
  } catch (error) {
    return {
      error: stringifyError(error),
    };
  }
}

export async function loadSyncSettings(): Promise<SyncSettings> {
  const settings = await chrome.storage.sync.get(DEFAULT_SYNC_SETTINGS);
  const { secretsSchema, ...rest } = syncSettingsSchema.parse(settings);
  return {
    ...rest,
    secretsSchema: JSON.parse(secretsSchema),
  };
}

export async function saveSyncSettings({
  secretsSchema,
  ...rest
}: Partial<SyncSettings>) {
  const data = partialSyncSettingsSchema.parse({
    ...rest,
    secretsSchema: JSON.stringify(secretsSchema),
  });
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
  tabId: number,
  config: string
): Promise<EvalResult> {
  const localConfig = await loadLocalSettings();
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: evalOperator,
    args: [config, localConfig.secrets],
  });
  if ("error" in result) {
    throw new Error(result.error);
  }
  return evalResultSchema.parse(result);
}

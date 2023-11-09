import Handlebars from "handlebars";
import { z } from "zod";

import rawConfig from "./config.yml?raw";

const localSettingsSchema = z.object({
  apiKey: z.string(),
});

const partialLocalSettingsSchema = localSettingsSchema.partial();

export type LocalSettings = z.infer<typeof localSettingsSchema>;

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  apiKey: "api-key",
};

const syncSettingsSchema = z.object({
  config: z.string(),
});

const partialSyncSettingsSchema = syncSettingsSchema.partial();

export type SyncSettings = z.infer<typeof syncSettingsSchema>;

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  config: rawConfig,
};

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

const tabSchema = z.object({
  id: z.number(),
  title: z.string(),
  favIconUrl: z.string().optional(),
});

const tabsSchema = z.array(tabSchema);

export type Tab = z.infer<typeof tabSchema>;

export function getAllTabs() {
  return chrome.tabs.query({}).then(tabsSchema.parse);
}

export const evalResultSchema = z.object({
  endpoint: z.string(),
  value: z.unknown(),
  schema: z.record(z.unknown()).optional(),
  uiSchema: z.record(z.unknown()).optional(),
});

export type EvalResult = z.infer<typeof evalResultSchema>;

async function evalOperator(config: string) {
  const {
    parse,
    configSchema,
    makeAppOperatorResolver,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    hbs,
  } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String,
  };
  try {
    if (config.trim() === "") {
      throw new Error("No config");
    }
    const configData = parse(config);
    const parseResult = configSchema.safeParse(configData);
    if (!parseResult.success) {
      throw new Error("Invalid config");
    }
    const { data, uiSchema, schema, context, endpoint } = parseResult.data;
    const resolver = makeAppOperatorResolver(window, hbs);
    const value = await evalInScope(traverseJsonLike(resolver, data), {
      functions: {},
      constants: {},
      context,
    });
    return {
      endpoint,
      value,
      schema,
      uiSchema,
    };
  } catch (error) {
    return {
      error: stringifyError(error),
    };
  }
}

export async function evalForTab(
  tabId: number,
  config: string
): Promise<EvalResult> {
  // const localConfig = await loadLocalSettings();
  // const compiledConfig = Handlebars.compile(config)(localConfig);
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: evalOperator,
    args: [config],
  });
  if (result.error) {
    throw new Error(result.error);
  }
  return evalResultSchema.parse(result);
}

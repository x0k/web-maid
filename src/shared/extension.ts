import { z } from "zod";

const localSettingsSchema = z.object({
  apiKey: z.string(),
});

const partialLocalSettingsSchema = localSettingsSchema.partial();

export type LocalSettings = z.infer<typeof localSettingsSchema>;

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  apiKey: "",
};

const syncSettingsSchema = z.object({
  config: z.string(),
});

const partialSyncSettingsSchema = syncSettingsSchema.partial();

export type SyncSettings = z.infer<typeof syncSettingsSchema>;

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  config: `endpoint: http://localhost:3000
schema:
  type: object
  properties:
    title:
      type: string
    url:
      type: string
    html:
      type: string
    selection:
      type: string
data:
  title:
    $op: document
    key: title
  url:
    $op: document
    key:
      - location
      - href
  html:
    $op: document
    key:
      - documentElement
      - outerHTML
  selection:
    $op: jsEval
    default: ""
    expression: document.getSelection().toString()
`,
};

export async function loadSyncSettings(
  sync: chrome.storage.SyncStorageArea
): Promise<SyncSettings> {
  const settings = await sync.get(DEFAULT_SYNC_SETTINGS);
  return syncSettingsSchema.parse(settings);
}

export async function saveSyncSettings(
  sync: chrome.storage.SyncStorageArea,
  settings: Partial<SyncSettings>
) {
  const data = partialSyncSettingsSchema.parse(settings);
  await sync.set(data);
}

export async function loadLocalSettings(
  local: chrome.storage.LocalStorageArea
): Promise<LocalSettings> {
  const settings = await local.get(DEFAULT_LOCAL_SETTINGS);
  return localSettingsSchema.parse(settings);
}

export async function saveLocalSettings(
  local: chrome.storage.LocalStorageArea,
  settings: Partial<LocalSettings>
) {
  const data = partialLocalSettingsSchema.parse(settings);
  await local.set(data);
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
  } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String
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
    const resolver = makeAppOperatorResolver(window, document);
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

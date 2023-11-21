import type { ConfigFile } from './core';

// Type only imports
export async function injectedConfigEval(
  contextId: string,
  configFiles: ConfigFile[],
  secrets: string,
  debug: boolean
) {
  const { evalConfig, stringifyError } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String,
  };
  try {
    return await evalConfig({
      configFiles,
      secrets,
      debug,
      contextId,
    });
  } catch (error) {
    return {
      __error: stringifyError(error),
    };
  }
}

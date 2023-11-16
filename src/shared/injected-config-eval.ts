// Type only imports
export async function injectedConfigEval(
  contextId: string,
  config: string,
  secrets: string,
  debug: boolean
) {
  const { evalConfig, stringifyError } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String,
  };
  try {
    return await evalConfig({
      config,
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

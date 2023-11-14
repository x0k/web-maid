// Type only imports
import type { Json } from "@/lib/zod";

export async function removeConfigEval(
  contextId: string,
  config: string,
  secrets: Json,
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

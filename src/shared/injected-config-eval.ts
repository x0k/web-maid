// Type only imports
import type { Injected } from "@/inject";
import type { ConfigFile } from "./core";

export async function injectedConfigEval(
  contextId: string,
  configFiles: ConfigFile[],
  secrets: string,
  debug: boolean
) {
  function readInjection(maxScansCount: number) {
    return (
      window.__SCRAPER_EXTENSION__ ||
      new Promise<Injected | undefined>((resolve) => {
        let scansCount = 1;
        const interval = setInterval(() => {
          if (window.__SCRAPER_EXTENSION__ || scansCount++ > maxScansCount) {
            clearInterval(interval);
            resolve(window.__SCRAPER_EXTENSION__);
          }
        }, 100);
      })
    );
  }
  const injection = await readInjection(30);
  if (!injection) {
    return {
      __error: "Invalid injection",
    };
  }
  const { evalConfig, stringifyError } = injection;
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

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
      window.__WEB_MAID__INJECTION ||
      new Promise<Injected | undefined>((resolve) => {
        let scansCount = 1;
        const interval = setInterval(() => {
          if (window.__WEB_MAID__INJECTION || scansCount++ > maxScansCount) {
            clearInterval(interval);
            resolve(window.__WEB_MAID__INJECTION);
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

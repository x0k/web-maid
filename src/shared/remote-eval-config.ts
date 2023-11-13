import { Json } from "@/lib/zod";

export async function removeEvalConfig(
  contextId: string,
  config: string,
  secrets: Json,
  debug: boolean
) {
  const {
    evalConfig,
    evaluator,
    makeRemote,
    rendered,
    validator,
    stringifyError,
  } = window.__SCRAPER_EXTENSION__ ?? {
    stringifyError: String,
  };
  try {
    const { formShower, logger } = makeRemote(contextId);
    return await evalConfig({
      config,
      debug,
      secrets,
      operatorFactoryConfig: {
        window,
        evaluator,
        rendered,
        validator,
        formShower,
        logger,
      },
    });
  } catch (error) {
    return {
      __error: stringifyError(error),
    };
  }
}

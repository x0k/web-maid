// Type only imports
import type { ScopedOp } from "@/lib/operator";
import type { Json } from "@/lib/zod";

export async function removeEvalConfig(
  contextId: string,
  config: string,
  secrets: Json,
  debug: boolean
) {
  const {
    evalConfig,
    compileOperatorFactories,
    makeComposedFactory,
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
    const operatorsFactory = makeComposedFactory(
      compileOperatorFactories({
        window,
        evaluator,
        rendered,
        validator,
        formShower,
        logger,
        operatorsFactory: {
          Create(config): ScopedOp<unknown> {
            return operatorsFactory.Create(config);
          },
        },
      })
    );
    return await evalConfig({
      config,
      debug,
      secrets,
      logger,
      operatorsFactory,
    });
  } catch (error) {
    return {
      __error: stringifyError(error),
    };
  }
}

import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeDebugFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { Json } from "@/lib/zod";

import { OperatorFactoryConfig, compileOperatorFactories } from "./operator";

export interface EvalConfigRunnerOptions {
  config: string;
  debug: boolean;
  secrets: Json;
  operatorFactoryConfig: OperatorFactoryConfig;
}

export function evalConfig({
  config,
  debug,
  secrets,
  operatorFactoryConfig,
}: EvalConfigRunnerOptions) {
  const configData = parse(config);
  const composedFactory = makeComposedFactory(
    compileOperatorFactories(operatorFactoryConfig)
  );
  const resolver = makeOperatorResolver(
    debug
      ? makeDebugFactory(composedFactory, operatorFactoryConfig.logger)
      : composedFactory
  );
  return evalInScope(traverseJsonLike(resolver, configData), {
    functions: {},
    constants: {},
    context: secrets,
  });
}

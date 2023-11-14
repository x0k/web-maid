import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  ScopedOpFactory,
  evalInScope,
  makeDebugFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { Json } from "@/lib/zod";
import { ILogger } from "@/lib/logger";

export interface EvalConfigRunnerOptions {
  config: string;
  debug: boolean;
  secrets: Json;
  logger: ILogger;
  operatorsFactory: ScopedOpFactory<unknown>;
}

export function evalConfig({
  config,
  debug,
  secrets,
  logger,
  operatorsFactory,
}: EvalConfigRunnerOptions) {
  const configData = parse(config);
  const resolver = makeOperatorResolver(
    debug ? makeDebugFactory(operatorsFactory, logger) : operatorsFactory
  );
  return evalInScope(traverseJsonLike(resolver, configData), {
    functions: {},
    constants: {},
    context: secrets,
  });
}

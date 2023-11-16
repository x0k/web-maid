import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";

export interface EvalConfigOptions {
  config: string;
  secrets: string;
  operatorResolver: (value: unknown) => unknown;
}

export function evalConfig({
  config,
  secrets,
  operatorResolver,
}: EvalConfigOptions) {
  return evalInScope(traverseJsonLike(operatorResolver, parse(config)), {
    functions: {},
    constants: {},
    context: parse(secrets),
    error: null,
  });
}

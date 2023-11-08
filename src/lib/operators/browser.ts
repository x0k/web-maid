import { z } from "zod";

import { AutoFactory, OpFactory, OpOrVal } from "@/lib/operator";
import { get } from "@/lib/object";
import { jsonSchema } from "@/lib/zod";
import { evalInScope } from "@/lib/eval";

export abstract class BrowserFactory<
  Z extends z.ZodType
> extends AutoFactory<Z> {
  constructor(
    protected readonly window: Window,
    protected readonly document: Document
  ) {
    super();
  }
}

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const documentConfig = z.object({
  key: composedKeyConfig,
  default: z.any().optional(),
});

export class DocumentOpFactory extends BrowserFactory<typeof documentConfig> {
  readonly schema = documentConfig;
  exec({ key, default: defaultValue }: z.TypeOf<this["schema"]>): OpOrVal {
    const value = get(key, this.document);
    if (value !== undefined) {
      return jsonSchema.parse(value);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Value not found for key "${key}"`);
  }
}

const jsEvalConfig = z.object({
  expression: z.string(),
  default: z.any().optional(),
});

export class JsEvalOpFactory extends BrowserFactory<typeof jsEvalConfig> {
  readonly schema = jsEvalConfig;
  private evalScope = {
    window: this.window,
    document: this.document,
  };
  exec({
    expression,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): OpOrVal {
    if (defaultValue === undefined) {
      return evalInScope(expression, this.evalScope);
    }
    try {
      return evalInScope(expression, this.evalScope);
    } catch (e) {
      console.error(e);
      return defaultValue;
    }
  }
}

export function browserOperatorsFactories(
  window: Window,
  document: Document
): Record<string, OpFactory> {
  return {
    document: new DocumentOpFactory(window, document),
    jsEval: new JsEvalOpFactory(window, document),
  };
}

import { z } from "zod";
import { AutoFactory, OpFactory, OpOrVal } from "@/lib/operator";
import { get } from "@/lib/object";
import { jsonSchema } from '@/lib/zod';

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const documentConfig = z.object({
  key: composedKeyConfig,
  default: z.any().optional(),
});

export class DocumentOpFactory extends AutoFactory<typeof documentConfig> {
  readonly schema = documentConfig;
  exec({ key, default: defaultValue }: z.TypeOf<this["schema"]>): OpOrVal {
    const value = get(key, document);
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
})

export class JsEvalOpFactory extends AutoFactory<typeof jsEvalConfig> {
  readonly schema = jsEvalConfig;
  exec({ expression }: z.TypeOf<this["schema"]>): OpOrVal {
    return eval(expression);
  }
}

export function browserOperatorsFactories(): Record<string, OpFactory> {
  return {
    document: new DocumentOpFactory(),
    jsEval: new JsEvalOpFactory(),
  };
}

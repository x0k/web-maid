import { z } from "zod";
import { AutoFactory, OpFactory, OpOrVal } from "@/lib/operator";
import { get } from "@/lib/object";

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const documentConfig = z.object({
  key: composedKeyConfig,
});

export class DocumentOpFactory extends AutoFactory<typeof documentConfig> {
  readonly schema = documentConfig;
  exec({ key }: z.TypeOf<this["schema"]>): OpOrVal {
    const value = get(key, document);
    if (value === undefined) {
      throw new Error(`Value not found for key "${key}"`);
    }
    return String(value);
  }
}

export function browserOperatorsFactories(): Record<string, OpFactory> {
  return {
    document: new DocumentOpFactory(),
  };
}

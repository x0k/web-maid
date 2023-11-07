import type { TypeOf, ZodType } from "zod";

import type { Factory } from "@/lib/factory";
import type { JSONPrimitive } from "@/lib/json";
import { traverseJsonLike, type JsonLike } from "@/lib/json-like-traverser";

export const OPERATOR_KEY = "$op";

export type Op = (context: OpOrVal) => OpOrVal;

export type OpOrVal = JsonLike<JSONPrimitive | Op>;

export type OpFactoryConfig = Record<string, OpOrVal>;

export interface OpFactory extends Factory<OpFactoryConfig, OpOrVal> {}

export abstract class SimpleFactory<S extends ZodType> implements OpFactory {
  abstract readonly schema: S;

  protected abstract create(value: TypeOf<this["schema"]>): Op;

  Create(config: OpFactoryConfig): Op {
    return this.create(this.schema.parse(config));
  }
}

export function evalOnContext(value: OpOrVal, context: OpOrVal) {
  return traverseJsonLike((v: OpOrVal) => {
    if (typeof v === "function") {
      return v(context);
    }
    return v;
  }, value);
}

export abstract class AutoFactory<Z extends ZodType> implements OpFactory {
  abstract readonly schema: Z;

  protected abstract exec(value: TypeOf<this["schema"]>): OpOrVal;

  Create(config: OpFactoryConfig): Op {
    return (context) => {
      const resolvedConfig = evalOnContext(config, context);
      return this.exec(this.schema.parse(resolvedConfig));
    };
  }
}

export function composedFactory(
  factories: Record<string, OpFactory>
): OpFactory {
  return {
    Create(value) {
      const name = value[OPERATOR_KEY];
      if (typeof name !== "string") {
        throw new Error(`Invalid operator name: ${name}`);
      }
      const f = factories[name];
      if (!f) {
        throw new Error(`Unknown operator: ${name}`);
      }
      return f.Create(value);
    },
  };
}

export function makeOperatorResolver(factory: OpFactory) {
  return (context: OpOrVal) => {
    if (
      typeof context === "object" &&
      context !== null &&
      OPERATOR_KEY in context
    ) {
      return factory.Create(context);
    }
    return context;
  };
}

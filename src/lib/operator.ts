import { z, type TypeOf, type ZodType } from "zod";

import { isFunction, isObject, isRecord } from "@/lib/guards";

export type Ast<T> = T | Array<Ast<T>> | { [k: string]: Ast<T> };

export type ResolvedAst<R> = R | Array<R> | Record<string, R>;

export type AstVisitor<T, R> = (value: T | ResolvedAst<R>) => Promise<R>;

async function traverseAst<T, R>(
  visitor: AstVisitor<T, R>,
  value: Ast<T>
): Promise<R> {
  if (Array.isArray(value)) {
    const tmp = new Array<Promise<R>>(value.length);
    for (let i = 0; i < value.length; i++) {
      tmp[i] = traverseAst(visitor, value[i]);
    }
    return visitor(await Promise.all(tmp));
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    const promises = new Array<Promise<R>>(keys.length);
    for (let i = 0; i < keys.length; i++) {
      promises[i] = traverseAst(visitor, value[keys[i]]);
    }
    const values = await Promise.all(promises);
    const tmp: Record<string, R> = {};
    for (let i = 0; i < keys.length; i++) {
      tmp[keys[i]] = values[i];
    }
    return visitor(tmp);
  }
  return visitor(value);
}

export const OPERATOR_KEY = "$op";

export type Result<R> = R | Promise<R>;

export type Op<T, R> = (input: T) => Result<R>;

export type OpOrVal<T, R> = R | Op<T, R>;

export type Factory<C, R> = (config: C) => R;

export type OpFactoryConfig<T, R> = Record<string, OpOrVal<T, R>>;

export type OpFactory<C, T, R> = Factory<C, Op<T, R>>;

export async function evalOnContext<T, R>(
  value: Ast<OpOrVal<T, R>>,
  context: T
): Promise<R> {
  // @ts-expect-error ouch
  return Promise.resolve(
    // @ts-expect-error ouch2
    traverseAst((v) => {
      if (isFunction<Op<T, R>>(v)) {
        return v(context);
      }
      return v;
    }, value)
  );
}

export function withSchema<S extends ZodType, T, R>(
  schema: S,
  factory: OpFactory<TypeOf<S>, T, R>
) {
  return (value: T) => factory(schema.parse(value));
}

export interface Scope<R> {
  functions: Record<string, Op<Scope<R>, R>>;
  constants: Record<string, OpOrVal<Scope<R>, R>>;
  value: R;
}

function mergeScopes<R>(a: Scope<R>, b: Partial<Scope<R>>): Scope<R> {
  return {
    value: a.value,
    functions: b.functions ? { ...a.functions, ...b.functions } : a.functions,
    constants: b.constants ? { ...a.constants, ...b.constants } : a.constants,
  };
}

const defineConfig = z.object({
  functions: z.record(z.function()).optional(),
  constants: z.record(z.unknown()).optional(),
  for: z.unknown(),
});

export const defineOperatorFactory = withSchema(
  defineConfig,
  ({ functions, constants, for: action }) => {
    return async (context: Scope<unknown>) => {
      let evaluatedConstants: Record<string, unknown> | undefined;
      if (constants) {
        const data = await evalOnContext(constants, context);
        if (isRecord(data)) {
          evaluatedConstants = data;
        } else {
          throw new Error("Constants must be an object");
        }
      }
      const newScope = mergeScopes(context, {
        functions,
        constants: evaluatedConstants,
      });
      return evalOnContext(action, newScope);
    };
  }
);

import type { TypeOf, ZodType } from "zod";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { isFunction, isObject } from "@/lib/guards";

export type Ast<T> = T | Array<Ast<T>> | { [k: string]: Ast<T> };

export type ResolvedAst<R> = R | Array<R> | Record<string, R>;

export type AstVisitor<T, R> = (value: T | ResolvedAst<R>) => R;

async function traverseAst<T, R>(visitor: AstVisitor<T, R>, value: Ast<T>) {
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

export interface ExecutionContext<R> {
  functions: Record<string, Op<R>>;
  constants: Record<string, OpOrVal<R>>;
  value: R;
  stack: string[];
}

export type Op<R> = (context: ExecutionContext<R>) => Result<R>;

export type OpOrVal<R> = R | Op<R>;

export type OpFactoryConfig<R> = Record<string, OpOrVal<R>>;

export async function evalOnContext2<R>(
  value: Ast<R | Op<R>>,
  context: ExecutionContext<R>
) {
  return traverseAst((v: ResolvedAst<R>) => {
    if (isFunction(v)) {
      return v(context);
    }
    return v;
  }, value);
}

export type Factory<T, R> = (value: T) => R;

export function withValidation<S extends ZodType, R, T = unknown>(
  schema: S,
  factory: Factory<TypeOf<S>, R>
): Factory<T, R> {
  return (value) => factory(schema.parse(value));
}

export type OpFactory<R> = Factory<OpFactoryConfig<R>, Op<R>>;

export type OpExecutorFactory<R> = Factory<OpFactoryConfig<R>, OpExecutor<R>>;

export function withContext<R>(
  name: string,
  factory: OpFactory<R>
): OpExecutorFactory<R> {
  return (config) => {
    const op = factory(config);
    return async (context) => ({
      ...context,
      context: await op(context.context),
      stack: context.stack.concat(name),
    });
  };
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

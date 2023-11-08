import { z, type TypeOf, type ZodType } from "zod";

import { isObject, isRecord } from "@/lib/guards";
import { Factory } from "@/lib/factory";

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

export type Op<T, R> = (context: T) => Result<R>;

export type OpOrVal<T, R> = R | Op<T, R>;

export interface Scope<R> {
  functions: Record<string, Op<Scope<R>, R>>;
  constants: Record<string, OpOrVal<Scope<R>, R>>;
  context: R;
}

export type ScopedOp<R> = Op<Scope<R>, R>;

export type ScopedOpFactory<R> = Factory<unknown, OpOrVal<Scope<R>, R>>;

export async function evalInScope<T, R>(
  value: Ast<OpOrVal<T, R>>,
  scope: T
): Promise<R> {
  // @ts-expect-error ouch
  return Promise.resolve(
    traverseAst((v) => {
      if (typeof v === "function") {
        return v(scope);
      }
      return v;
    }, value)
  );
}

export abstract class BaseOpFactory<S extends ZodType, R>
  implements Factory<unknown, OpOrVal<Scope<R>, R>>
{
  abstract readonly schema: S;
  abstract Create(config: unknown): OpOrVal<Scope<R>, R>;
}

export abstract class FlowOpFactory<S extends ZodType, R> extends BaseOpFactory<
  S,
  R
> {
  protected abstract create(config: TypeOf<this["schema"]>): ScopedOp<R>;

  Create(config: unknown): OpOrVal<Scope<R>, R> {
    return this.create(this.schema.parse(config));
  }
}

export abstract class TaskOpFactory<S extends ZodType, R> extends BaseOpFactory<
  S,
  R
> {
  protected abstract execute(config: TypeOf<this["schema"]>): Result<R>;

  Create(config: unknown): OpOrVal<Scope<R>, R> {
    return async (scope) => {
      const resolvedConfig = await evalInScope(config, scope);
      return this.execute(this.schema.parse(resolvedConfig));
    };
  }
}

const defineConfig = z.object({
  functions: z.record(z.function()).optional(),
  constants: z.record(z.unknown()).optional(),
  for: z.unknown(),
});

export class DefineOpFactory extends FlowOpFactory<
  typeof defineConfig,
  unknown
> {
  schema = defineConfig;
  protected create({
    constants,
    functions,
    for: action,
  }: TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      let evaluatedConstants: Record<string, unknown> | undefined;
      if (constants) {
        const data = await evalInScope(constants, scope);
        if (isRecord(data)) {
          evaluatedConstants = data;
        } else {
          throw new Error("Constants must be an object");
        }
      }
      const newScope: Scope<unknown> = {
        context: scope.context,
        functions: functions
          ? { ...scope.functions, ...functions }
          : scope.functions,
        constants: evaluatedConstants
          ? { ...scope.constants, ...evaluatedConstants }
          : scope.constants,
      };
      return evalInScope(action, newScope);
    };
  }
}

const callConfig = z.object({
  fn: z.unknown(),
  arg: z.unknown().optional(),
});

export class CallOpFactory extends FlowOpFactory<typeof callConfig, unknown> {
  schema = callConfig;
  protected create({ fn, arg }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const fnName = await evalInScope(fn, scope);
      if (typeof fnName !== "string") {
        throw new Error(`Function name is not a string: ${fnName}`);
      }
      const f = scope.functions[fnName];
      return f(
        arg ? { ...scope, context: await evalInScope(arg, scope) } : scope
      );
    };
  }
}

const getConfig = z.object({
  const: z.unknown(),
  default: z.unknown().optional(),
});

export class GetOpFactory extends FlowOpFactory<typeof getConfig, unknown> {
  schema = getConfig;
  protected create({
    const: name,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const constName = await evalInScope(name, scope);
      if (typeof constName !== "string") {
        throw new Error(`Constant name is not a string: ${constName}`);
      }
      const value = scope.constants[constName];
      if (value !== undefined) {
        return value;
      }
      if (defaultValue !== undefined) {
        return await evalInScope(defaultValue, scope);
      }
      throw new Error(`Constant ${constName} is not defined`);
    };
  }
}

export const sysOpFactories: Record<string, ScopedOpFactory<unknown>> = {
  "sys.define": new DefineOpFactory(),
  "sys.call": new CallOpFactory(),
  "sys.get": new GetOpFactory(),
};

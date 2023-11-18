import { type TypeOf, type ZodType } from "zod";

import { isObject } from "@/lib/guards";
import { Factory } from "@/lib/factory";

import { ILogger } from "./logger";

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
  functions: Record<string, ScopedOp<R>>;
  constants: Record<string, OpOrVal<Scope<R>, R>>;
  error: unknown;
  context: R;
}

export type ScopedOp<R> = Op<Scope<unknown>, R>;

export type ScopedOpFactory<R> = Factory<Record<string, unknown>, ScopedOp<R>>;

export async function evalInScope<T, R>(
  value: Ast<OpOrVal<Scope<T>, R>>,
  scope: Scope<T>
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

export interface OpExample {
  description: string;
  code: string;
  result: string
}

export abstract class BaseOpFactory<S extends ZodType, R>
  implements ScopedOpFactory<R>
{
  public abstract readonly name: string;
  public readonly signature: string = "No signature provided";
  public readonly description: string = "No description provided";
  public readonly examples: OpExample[] = []
  public abstract readonly schema: S;
  abstract Create(config: unknown): ScopedOp<R>;
}

export abstract class FlowOpFactory<S extends ZodType, R> extends BaseOpFactory<
  S,
  R
> {
  protected abstract create(config: TypeOf<this["schema"]>): ScopedOp<R>;

  Create(config: unknown): ScopedOp<R> {
    return this.create(this.schema.parse(config));
  }
}

export abstract class TaskOpFactory<S extends ZodType, R> extends BaseOpFactory<
  S,
  R
> {
  protected abstract execute(config: TypeOf<this["schema"]>): Result<R>;

  Create(config: unknown): ScopedOp<R> {
    return async (scope) => {
      const resolvedConfig = await evalInScope(config, scope);
      return this.execute(this.schema.parse(resolvedConfig));
    };
  }
}

export function makeComposedFactory<T extends Record<string, unknown>, R>(
  factories: Record<string, Factory<T, R>>
): Factory<T, R> {
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

export function makeOperatorResolver<R>(
  factory: Factory<Record<string, unknown>, R>
) {
  return <C>(context: C) => {
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

export function makeDebugFactory<T extends Record<string, unknown>, R>(
  factory: Factory<T, R>,
  logger: ILogger
): Factory<T, R> {
  let counter = 0;
  return {
    Create(config) {
      const factoryResult = factory.Create(config);
      if (typeof factoryResult !== "function") {
        return factoryResult;
      }
      const operator = `${config[OPERATOR_KEY]}#${counter++}`;
      const fn = function (...args: unknown[]) {
        logger.log({
          executing: operator,
          config,
          scope: args[0],
        });
        try {
          const returns = factoryResult(...args);
          if (returns instanceof Promise) {
            return returns.then(
              (returns) => {
                logger.log({
                  operator,
                  returns,
                });
                return returns;
              },
              (error) => {
                logger.log({
                  operator,
                  error,
                });
                return Promise.reject(error);
              }
            );
          }
          logger.log({
            operator,
            returns,
          });
          return returns;
        } catch (error) {
          logger.log({
            operator,
            error,
          });
          throw error;
        }
      };
      fn.toString = () => `<${operator}>`;
      return fn as R;
    },
  };
}

import { z } from "zod";

import {
  evalInScope,
  FlowOpFactory,
  ScopedOp,
  TaskOpFactory,
} from "@/lib/operator";

const pipeConfig = z.object({
  do: z.array(z.unknown()),
});

export class PipeOpFactory extends FlowOpFactory<typeof pipeConfig, unknown> {
  readonly schema = pipeConfig;
  create({ do: operators }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const result = { ...scope };
      for (const op of operators) {
        result.context = await evalInScope(op, result);
      }
      return result.context;
    };
  }
}

const andConfig = z.object({
  conditions: z.array(z.unknown()),
});

export class AndOpFactory extends FlowOpFactory<typeof andConfig, unknown> {
  readonly schema = andConfig;
  create({ conditions }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      let result: unknown;
      for (const condition of conditions) {
        result = await evalInScope(condition, scope);
        if (!result) {
          return result;
        }
      }
      return result;
    };
  }
}

const notConfig = z.object({
  value: z.any(),
});

export class NotOpFactory extends TaskOpFactory<typeof notConfig, boolean> {
  readonly schema = notConfig;
  execute({ value }: z.TypeOf<this["schema"]>): boolean {
    return !value;
  }
}

const ifConfig = z.object({
  condition: z.unknown(),
  then: z.unknown(),
  else: z.unknown().default(null),
});

export class IfOpFactory extends FlowOpFactory<typeof ifConfig, unknown> {
  readonly schema = ifConfig;
  create({
    condition,
    then,
    else: otherwise,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const result = await evalInScope(condition, scope);
      if (result) {
        return evalInScope(then, scope);
      }
      return evalInScope(otherwise, scope);
    };
  }
}

const condConfig = z.object({
  cases: z.array(z.tuple([z.unknown(), z.unknown()])),
  default: z.unknown().optional(),
});

export class CondOpFactory extends FlowOpFactory<typeof condConfig, unknown> {
  readonly schema = condConfig;
  create({
    cases,
    default: otherwise,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      for (const [condition, then] of cases) {
        const result = await evalInScope(condition, scope);
        if (result) {
          return evalInScope(then, scope);
        }
      }
      if (otherwise === undefined) {
        throw new Error("No case matched");
      }
      return evalInScope(otherwise, scope);
    };
  }
}

export function flowOperatorsFactories() {
  return {
    pipe: new PipeOpFactory(),
    and: new AndOpFactory(),
    not: new NotOpFactory(),
    if: new IfOpFactory(),
    cond: new CondOpFactory(),
  };
}

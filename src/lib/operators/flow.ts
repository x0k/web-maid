import { z } from "zod";

import {
  evalInScope,
  FlowOpFactory,
  ScopedOp,
  TaskOpFactory,
} from "@/lib/operator";
import { compareJsonValue } from "@/lib/json";
import { jsonSchema } from "@/lib/zod";
import { get } from "@/lib/object";
import { isObject, isRecord } from "@/lib/guards";

const pipeConfig = z.object({
  do: z.array(z.unknown()),
});

export class PipeOpFactory extends FlowOpFactory<typeof pipeConfig, unknown> {
  name = "pipe";
  signature = `interface PipeConfig<R> {
  do: R[]
}
function pipe<R>(config: PipeConfig<R>): R`;
  description =
    "Passes the result of the previous operator as the context to the next operator";
  examples = [
    {
      description: "Basic usage",
      code: `$op: pipe
do:
  - key: value
  - $op: get
    key: key
`,
      result: "value",
    },
  ];
  schema = pipeConfig;
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
  conditions: z.array(z.unknown()).min(1),
});

export class AndOpFactory extends FlowOpFactory<typeof andConfig, unknown> {
  name = "and";
  signature = `interface AndConfig<R> {
  conditions: R[]
}
function and<R>(config: AndConfig<R>): R`;
  description = `Evaluates conditions one by one.
If any of the conditions fails, returns the result of the failed condition,
otherwise returns the result of the last condition.`;
  examples = [
    {
      description: "Basic usage",
      code: `$op: and
conditions:
  - true
  - string
  - 0
  - null`,
      result: `0`,
    },
  ];
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
  name = "not";
  signature = `interface NotConfig {
  value: any;
}
function not(config: NotConfig): boolean`;
  description = "Takes truthy values to `false` and falsy values to `true`";
  examples = [
    {
      description: "Basic usage",
      code: `$op: not
value: some value`,
      result: "false",
    },
  ];
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
  name = "if";
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
  name = "cond";
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

const binaryConfig = z.object({
  left: jsonSchema,
  right: jsonSchema,
});

export class LtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lt";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === -1;
  }
}

export class LteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lte";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) < 1;
  }
}

export class GtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gt";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 1;
  }
}

export class GteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gte";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) > -1;
  }
}

export class EqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "eq";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 0;
  }
}

export class NeqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "neq";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) !== 0;
  }
}

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const arrayOrRecordConfig = z.array(z.unknown()).or(z.record(z.unknown()));

const getConfig = z.object({
  key: z.unknown().optional(),
  from: z.unknown().optional(),
  default: z.unknown().optional(),
});

export class GetOpFactory extends FlowOpFactory<typeof getConfig, unknown> {
  name = "get";
  readonly schema = getConfig;
  create({
    key,
    from,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      if (key === undefined) {
        return scope.context;
      }
      const resolvedKey = await evalInScope(key, scope);
      const realKey = composedKeyConfig.parse(resolvedKey);
      const resolvedFrom = await evalInScope(from ?? scope.context, scope);
      const realFrom = arrayOrRecordConfig.parse(resolvedFrom);
      return get(realKey, realFrom, defaultValue);
    };
  }
}

const updateConfig = z.object({
  source: z.unknown(),
  properties: z.unknown(),
});

export class UpdateOpFactory extends FlowOpFactory<
  typeof updateConfig,
  Record<string, unknown> | Array<unknown>
> {
  name = "update";
  readonly schema = updateConfig;
  create({
    source,
    properties,
  }: z.TypeOf<this["schema"]>): ScopedOp<
    Record<string, unknown> | Array<unknown>
  > {
    return async (scope) => {
      const evaluatedProperties = await evalInScope(properties, scope);
      if (!isRecord(evaluatedProperties)) {
        throw new Error("Properties must be an object");
      }
      const evaluatedSource = await evalInScope(source ?? scope.context, scope);
      if (Array.isArray(evaluatedSource)) {
        return evaluatedSource.map((v, i) => {
          const idx = i.toString();
          return idx in evaluatedProperties ? evaluatedProperties[idx] : v;
        });
      }
      if (isObject(evaluatedSource)) {
        return { ...evaluatedSource, ...evaluatedProperties };
      }
      throw new Error("Source must be an object or array");
    };
  }
}

const tryConfig = z.object({
  do: z.unknown(),
  catch: z.unknown().optional(),
  finally: z.unknown().optional(),
});

export class TryOpFactory extends FlowOpFactory<typeof tryConfig, unknown> {
  name = "try";
  schema = tryConfig;
  protected create({
    do: action,
    catch: rescue,
    finally: after,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      let errorOcurred = false;
      let errorHandled = false;
      const mutableScope = { ...scope };
      try {
        mutableScope.context = await evalInScope(action, mutableScope);
      } catch (error) {
        errorOcurred = true;
        mutableScope.error = error;
        if (rescue !== undefined) {
          mutableScope.context = await evalInScope(rescue, mutableScope);
          errorHandled = true;
        }
        // Will be executed even if catch block fails
      } finally {
        if (after !== undefined) {
          mutableScope.context = await evalInScope(after, mutableScope);
        }
      }
      if (errorOcurred && !errorHandled) {
        throw mutableScope.error;
      }
      return mutableScope.context;
    };
  }
}

const throwConfig = z.object({
  error: z.unknown(),
});

export class ThrowOpFactory extends FlowOpFactory<typeof throwConfig, unknown> {
  name = "throw";
  schema = throwConfig;
  protected create({ error }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return (scope) => evalInScope(error, scope).then(Promise.reject);
  }
}

export function flowOperatorsFactories() {
  return [
    new PipeOpFactory(),
    new AndOpFactory(),
    new NotOpFactory(),
    new IfOpFactory(),
    new CondOpFactory(),
    new LtOpFactory(),
    new LteOpFactory(),
    new GtOpFactory(),
    new GteOpFactory(),
    new EqOpFactory(),
    new NeqOpFactory(),
    new GetOpFactory(),
    new UpdateOpFactory(),
    new TryOpFactory(),
    new ThrowOpFactory(),
  ];
}

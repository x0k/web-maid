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
  value: z.unknown(),
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
  signature = `interface IfConfig<T, E> {
  condition: any;
  then: T;
  else?: E | null;
}
function if<T, E>({ condition, then, else = null }: IfConfig<T, E>): T | E | null`;
  description =
    "Returns `then` if `condition` is truthy, otherwise `else`. \
If `condition` is falsy and `else` is not provided, returns `null`.";
  examples = [
    {
      description: "Basic usage",
      code: `$op: if
condition: false
then: next value`,
      result: "null",
    },
  ];
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
  signature = `interface CondConfig<R> {
  cases: [condition: any, then: R][];
  default?: R;
}
function cond<R>(config: CondConfig<R>): R`;
  description =
    "Evaluates `conditions` in order until one returns truthy and returns the `then` value.\n\n\
- If none of the `conditions` return truthy and `default` is provided, returns `default`.\
- If none of the `conditions` return truthy and `default` is not provided, throws an error.";
  examples = [
    {
      description: "Basic usage",
      code: `$op: cond
cases:
  - [false, falsy]
  - [true, truthy]
default: default`,
      result: "truthy",
    },
  ];
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

function operatorSignature(name: string) {
  return `interface BinaryOperatorConfig {
  left: <json>;
  right: <json>;
}
function ${name}(config: BinaryOperatorConfig): boolean`;
}

export class LtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lt";
  signature = operatorSignature("lt");
  description = "Returns `true` if `left` is less than `right`.";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === -1;
  }
}

export class LteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lte";
  signature = operatorSignature("lte");
  description = "Returns `true` if `left` is less than or equal to `right`.";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) < 1;
  }
}

export class GtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gt";
  signature = operatorSignature("gt");
  description = "Returns `true` if `left` is greater than `right`.";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 1;
  }
}

export class GteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gte";
  signature = operatorSignature("gte");
  description = "Returns `true` if `left` is greater than or equal to `right`.";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) > -1;
  }
}

export class EqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "eq";
  signature = operatorSignature("eq");
  description = "Returns `true` if `left` is equal to `right`.";
  readonly schema = binaryConfig;
  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 0;
  }
}

export class NeqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "neq";
  signature = operatorSignature("neq");
  description = "Returns `true` if `left` is not equal to `right`.";
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
  signature = `interface GetConfig {
  key?: string | number | Array<string | number>;
  from?: any;
  default?: any;
}
function get({ key, from = <context>, default }: GetConfig): unknown`;
  description =
    "The operator works as follows:\n\n\
1. If `key` is not provided, returns current context\n\
2. If `key` is a string and `from` is an object and `from[key]` exists, returns `from[key]`\n\
3. If `key` is a number and `from` is an array and `from[key]` exists, returns `from[key]`\n\
4. If `key` is a array then steps 2 and 3 are repeated for each element of `key`, returns the last value\n\
5. If some previous step fails and `default` is provided, returns `default`\n\
6. Throws an error";
  examples = [
    {
      description: "Returns current context",
      code: "$op: get",
      result: "<context>",
    },
    {
      description: "Returns specified value",
      code: `$op: get
key: "token"
from:
  token: some-token`,
      result: "some-token",
    },
  ];
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
  source: z.unknown().optional(),
  properties: z.unknown(),
});

export class UpdateOpFactory extends FlowOpFactory<
  typeof updateConfig,
  Record<string, unknown> | Array<unknown>
> {
  name = "update";
  signature = `interface UpdateArrayConfig<T> {
  source?: Array<T>
  properties: Record<number, T>;
}
function update<T>({ source = <context>, properties }: UpdateArrayConfig<T>): Array<T>
interface UpdateRecordConfig<T> {
  source?: Record<string, T>
  properties: Record<string, T>;
}
function update<T>({ source = <context>, properties }: UpdateRecordConfig<T>): Record<string, T>`;
  description = "Updates `source` with `properties`";
  examples = [
    {
      description: "Updates array",
      code: `$op: update
source: [1, 2, 3]
properties:
  1: 10`,
      result: "[1, 10, 3]",
    },
    {
      description: "Updates object",
      code: `$op: update
source: { a: 1, b: 2 }
properties:
  a: 10`,
      result: "{ a: 10, b: 2 }",
    },
  ];
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
  signature = `interface TryConfig<R, C, F> {
  do: R;
  catch?: C;
  finally?: F;
}
function try<R, C, F>(config: TryConfig<R, C, F>): R | C | F`;
  description =
    "Catches and handles runtime errors. Works as follows:\n\
- Executes `do` block, returned value is rewritten as `context`\n\
  - If it fails, an error is stored in `scope`\n\
    - If `catch` block is provided, it is executed, returned value is rewritten as `context`\n\
- If `finally` block is provided, it is executed, returned value is rewritten as `context`\n\
- If an error is occurred, it is thrown\n\
- If no error is occurred, the `context` is returned";
  examples = [
    {
      description: "Catches and handles runtime errors",
      code: `$op: try
do:
  $op: throw
  error: "some error"
catch: 1
finally:
  $op: plus
  left:
    $op: get
  right: 1`,
      result: "2",
    },
  ];
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
  signature = `interface ThrowConfig {
  error: any;
}
function throw(config: ThrowConfig): void`;
  description = "Throws a runtime error";
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

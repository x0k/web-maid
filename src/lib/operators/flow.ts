import { z } from "zod";

import {
  evalInScope,
  FlowOpFactory,
  OpSignature,
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
  schema = pipeConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<R> {
  do: R[]
}`,
          returns: "R",
          description:
            "Passes the result of the previous operator as the context to the next operator",
        },
      ];
      this.examples = [
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
    }
  }
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
  schema = andConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<R> {
  conditions: R[]
}`,
          returns: "R",
          description: `Evaluates conditions one by one.
If any of the conditions fails, returns the result of the failed condition,
otherwise returns the result of the last condition.`,
        },
      ];
      this.examples = [
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
    }
  }
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
  schema = notConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface NotConfig {
  value: any;
}`,
          returns: "boolean",
          description:
            "Takes truthy values to `false` and falsy values to `true`",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: not
value: some value`,
          result: "false",
        },
      ];
    }
  }
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
  schema = ifConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface IfConfig<T, E> {
  condition: any;
  then: T;
  else?: E | null;
}`,
          returns: `T | E | null`,
          description:
            "Returns `then` if `condition` is truthy, otherwise `else`. \
If `condition` is falsy and `else` is not provided, returns `null`.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: if
condition: false
then: next value`,
          result: "null",
        },
      ];
    }
  }
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
  schema = condConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface CondConfig<R> {
  cases: [condition: any, then: R][];
  default?: R;
}`,
          returns: "R",
          description:
            "Evaluates `conditions` in order until one returns truthy and returns the `then` value.\n\n\
- If none of the `conditions` return truthy and `default` is provided, returns `default`.\
- If none of the `conditions` return truthy and `default` is not provided, throws an error.",
        },
      ];
      this.examples = [
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
    }
  }
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

function opSignatures(description: string): OpSignature[] {
  return [
    {
      params: `interface Config {
  left: <json>;
  right: <json>;
}`,
      returns: "boolean",
      description,
    },
  ];
}

export class LtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lt";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is less than `right`."
      );
    }
  }

  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === -1;
  }
}

export class LteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "lte";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is less than or equal to `right`."
      );
    }
  }

  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) < 1;
  }
}

export class GtOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gt";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is greater than `right`."
      );
    }
  }

  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 1;
  }
}

export class GteOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "gte";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is greater than or equal to `right`."
      );
    }
  }

  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) > -1;
  }
}

export class EqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "eq";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is equal to `right`."
      );
    }
  }

  execute({ left, right }: z.TypeOf<this["schema"]>): boolean {
    return compareJsonValue(left, right) === 0;
  }
}

export class NeqOpFactory extends TaskOpFactory<typeof binaryConfig, boolean> {
  name = "neq";
  readonly schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = opSignatures(
        "Returns `true` if `left` is not equal to `right`."
      );
    }
  }

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
  schema = getConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {}`,
          returns: "<context>",
          description: "Returns the current context",
        },
        {
          params: `interface Config {
  key: string;
  from: Record<string, unknown>;
  default?: any;
}`,
          returns: "unknown",
          description:
            "Returns `from[key]` if it exists, otherwise returns `default` if provided, otherwise throws an error",
        },
        {
          params: `interface Config {
  key: number;
  from: Array<unknown>;
  default?: any;
}`,
          returns: "unknown",
          description:
            "Returns `from[key]` if it exists, otherwise returns `default` if provided, otherwise throws an error",
        },
        {
          params: `type From = Record<string, unknown | From> | Array<unknown | From>
interface Config {
  key: Array<string | number>;
  from: From
  default?: any;
}`,
          returns: "unknown",
          description:
            "Retrieves a value from nested objects, if it exist, otherwise returns `default` if provided, otherwise throws an error",
        },
      ];
      this.examples = [
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
    }
  }
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
  schema = updateConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<T> {
  source?: Array<T>
  properties: Record<number, T>;
}`,
          returns: `Array<T>`,
          description: "Updates `source` array with `properties`",
        },
        {
          params: `interface Config<T> {
  source?: Record<string, T>
  properties: Record<string, T>;
}`,
          returns: `Record<string, T>`,
          description: "Updates `source` object with `properties`",
        },
      ];
      this.examples = [
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
    }
  }
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
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface TryConfig<R, C, F> {
  do: R;
  catch?: C;
  finally?: F;
}`,
          returns: ` R | C | F`,
          description:
            "Catches and handles runtime errors. Works as follows:\n\
- Executes `do` block, returned value is rewritten as `context`\n\
  - If it fails, an error is stored in `scope`\n\
    - If `catch` block is provided, it is executed, returned value is rewritten as `context`\n\
- If `finally` block is provided, it is executed, returned value is rewritten as `context`\n\
- If an error is occurred, it is thrown\n\
- If no error is occurred, the `context` is returned",
        },
      ];
      this.examples = [
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
    }
  }
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
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface ThrowConfig {
  error: any;
}`,
          returns: "never",
          description: "Throws a runtime error",
        },
      ];
    }
  }
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

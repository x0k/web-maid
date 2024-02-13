import { TypeOf, z } from "zod";

import {
  FlowOpFactory,
  OPERATOR_KEY,
  Scope,
  ScopedOp,
  ScopedOpFactory,
  evalInScope,
} from "@/lib/operator";
import { isRecord } from "@/lib/guards";
import { Factory } from "@/lib/factory";
import { traverseJsonLike } from "@/lib/json-like-traverser";
import { stringifyError } from "@/lib/error";

const defineConfig = z.object({
  functions: z.record(z.function()).optional(),
  constants: z.record(z.unknown()).optional(),
  for: z.unknown(),
});

export class DefineOpFactory extends FlowOpFactory<
  typeof defineConfig,
  unknown
> {
  name = "define";
  schema = defineConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<R> {
  functions?: Record<string, any>;
  constants?: Record<string, any>;
  for: R;
}`,
          returns: "R",
          description:
            "Defines a `functions` and/or `constants`. \
If `function` or `constant` already exists in `scope` it will be overwritten. \
Definition affects only `scope` that passes for evaluation `for` key.",
        },
      ];
      this.examples = [
        {
          description: "Override scope",
          code: `$op: sys.define
constants:
  const: 1
for:
  $op: sys.define
  constants:
    const: 2
  for:
    $op: plus
    left:
      $op: sys.get
      key: const
    right: 2`,
          result: "4",
        },
      ];
    }
  }
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
        ...scope,
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
  name = "call";
  schema = callConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  fn: string
  arg?: any
}`,
          returns: "unknown",
          description: "Calls a `function` and returns its result.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: sys.define
functions:
  add10:
    $op: plus
    left:
      $op: get
    right: 10
for:
  $op: sys.call
  fn: add10
  arg: 5`,
          result: "15",
        },
      ];
    }
  }
  protected create({ fn, arg }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const fnName = await evalInScope(fn, scope);
      if (typeof fnName !== "string") {
        throw new Error(`Function name is not a string: ${fnName}`);
      }
      const func = scope.functions[fnName];
      if (!func) {
        throw new Error(`Function ${fnName} is not defined`);
      }
      return func(
        arg ? { ...scope, context: await evalInScope(arg, scope) } : scope
      );
    };
  }
}

const getConfig = z.object({
  key: z.string(),
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
          params: `interface Config {
  key: string
  default?: any
}`,
          returns: "unknown",
          description:
            "Returns a `constant` from a current `scope`. \
If `constant` is not defined then `default` value is returned. \
If `default` is not defined then an error is thrown.",
        },
      ];
    }
  }
  protected create({
    key,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const constName = await evalInScope(key, scope);
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

const execConfig = z.object({
  op: z.unknown(),
  config: z.unknown().optional(),
  arg: z.unknown().optional(),
});

export class ExecOpFactory extends FlowOpFactory<typeof execConfig, unknown> {
  name = "exec";
  schema = execConfig;
  constructor(
    protected readonly operatorFactoryConfig: ScopedOpFactory<unknown>
  ) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  op: string;
  config?: Record<string, any>;
  arg?: any;
}`,
          returns: "unknown",
          description:
            "Executes an `operator` and returns its result. \
Can be used to execute `operators` with computed `config`.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: pipe
do:
  - key: key2
    key2: value
  - $op: sys.exec
    op: get
    config:
      $op: get`,
          result: "value",
        },
      ];
    }
  }

  protected create({
    op,
    config,
    arg,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      let opConfig: Record<string, unknown>;
      if (config === undefined) {
        opConfig = { [OPERATOR_KEY]: op };
      } else {
        const resolvedConfig = await evalInScope(config, scope);
        if (!isRecord(resolvedConfig)) {
          throw new Error("Config must be an object");
        }
        opConfig = { ...resolvedConfig, [OPERATOR_KEY]: op };
      }
      const scopedOp = this.operatorFactoryConfig.Create(opConfig);
      const context =
        arg === undefined ? scope.context : await evalInScope(arg, scope);
      return scopedOp({
        ...scope,
        context,
      });
    };
  }
}

const evalConfig = z.object({
  expression: z.unknown(),
});

export class EvalOpFactory extends FlowOpFactory<typeof evalConfig, unknown> {
  name = "eval";
  schema = evalConfig;

  constructor(private readonly operatorResolver: Factory<unknown, unknown>) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  expression: any;
}`,
          returns: `unknown`,
          description:
            "Evaluates an expression on the current `scope` and returns its result.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: pipe
do:
  - val
  - $op: sys.eval
    expression:
      $op: json.parse
      value: "{\\"$op\\": \\"get\\"}"`,
          result: "val",
        },
      ];
    }
  }

  protected create({ expression }: TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const opOrValue = traverseJsonLike(
        (v) => this.operatorResolver.Create(v),
        await evalInScope(expression, scope)
      );
      return await evalInScope(opOrValue, scope);
    };
  }
}

const errorConfig = z.unknown();

export class ErrorOpFactory extends FlowOpFactory<typeof errorConfig, unknown> {
  name = "err";
  schema = errorConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {}`,
          returns: "string",
          description:
            "Returns a last caught by `try` operator stringified error in the current `scope`.",
        },
      ];
    }
  }
  protected create(): ScopedOp<unknown> {
    return (scope) => stringifyError(scope.error);
  }
}

const waitConfig = z.object({
  ms: z.number(),
});

export class WaitOpFactory extends FlowOpFactory<typeof waitConfig, unknown> {
  name = "wait";
  schema = waitConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  ms: number
}`,
          returns: "<context>",
          description: "Waits for `ms` milliseconds and returns `context`.",
        },
      ];
    }
  }

  protected create({ ms }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return scope.context;
    };
  }
}

export function sysOperatorsFactories(
  operatorsFactory: ScopedOpFactory<unknown>,
  operatorResolver: Factory<unknown, unknown>
) {
  return [
    new DefineOpFactory(),
    new CallOpFactory(),
    new GetOpFactory(),
    new ExecOpFactory(operatorsFactory),
    new EvalOpFactory(operatorResolver),
    new ErrorOpFactory(),
    new WaitOpFactory(),
  ];
}

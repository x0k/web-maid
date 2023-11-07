import {
  SimpleFactory,
  type OpOrVal,
  type Op,
  evalOnContext,
  type OpFactory,
} from "@/lib/operator";
import { z, type ZodType } from "zod";

export interface Scope {
  constants: Record<string, OpOrVal>;
  functions: Record<string, Op>;
}

function mergeScopes(a: Scope, b: Partial<Scope>): Scope {
  return {
    constants: b.constants ? { ...a.constants, ...b.constants } : a.constants,
    functions: b.functions ? { ...a.functions, ...b.functions } : a.functions,
  };
}

export class RuntimeSystem {
  private scopes: Scope[] = [];
  private scopeCursor = 0;

  constructor(initialScope: Scope) {
    this.scopes.push(initialScope);
    this.scopeCursor = 0;
  }

  enter(scope: Partial<Scope>) {
    this.scopes.push(mergeScopes(this.scopes[this.scopeCursor++], scope));
  }

  exit() {
    this.scopes.pop();
    this.scopeCursor--;
  }

  getFunction(name: string) {
    return this.scopes[this.scopeCursor].functions[name];
  }

  getConstant(name: string) {
    return this.scopes[this.scopeCursor].constants[name];
  }
}

export abstract class RuntimeFactory<
  S extends ZodType
> extends SimpleFactory<S> {
  constructor(protected readonly system: RuntimeSystem) {
    super();
  }
}

const opConfig = z.function().args(z.any()).returns(z.any());

const defineConfig = z.object({
  constants: z.record(z.any()).optional(),
  functions: z.record(opConfig).optional(),
  for: z.any(),
});

export class DefineOpFactory extends RuntimeFactory<typeof defineConfig> {
  readonly schema = defineConfig;
  create({ constants, functions, for: scope }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      let evaluatedConstants: Record<string, OpOrVal> | undefined;
      if (constants) {
        evaluatedConstants = {};
        for (const [key, value] of Object.entries(constants)) {
          evaluatedConstants[key] = evalOnContext(value, context);
        }
      }
      this.system.enter({
        constants: evaluatedConstants,
        functions,
      });
      const result = evalOnContext(scope, context);
      this.system.exit();
      return result;
    };
  }
}

const callConfig = z.object({
  fn: z.any(),
  arg: z.any().optional(),
});

export class CallOpFactory extends RuntimeFactory<typeof callConfig> {
  readonly schema = callConfig;
  create({ fn, arg }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      const evaluatedArg = arg ? evalOnContext(arg, context) : context;
      const fnName = evalOnContext(fn, context);
      if (typeof fnName === "string") {
        return this.system.getFunction(fnName)(evaluatedArg);
      }
      throw new Error(`Function name is not a string: ${fnName}`);
    };
  }
}

const getConfig = z.object({
  const: z.any(),
  default: z.any().optional(),
})

export class GetConstOpFactory extends RuntimeFactory<typeof getConfig> {
  readonly schema = getConfig;
  create({ const: name, default: defaultValue }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      const constName = evalOnContext(name, context);
      if (typeof constName === "string") {
        const value = this.system.getConstant(constName)
        if (value !== undefined) {
          return value;
        }
        if (defaultValue !== undefined) {
          return evalOnContext(defaultValue, context);
        }
        throw new Error(`Constant ${constName} is not defined`);
      }
      throw new Error(`Constant name is not a string: ${constName}`);
    };
  }
}

export function runtimeOperatorsFactories(runtime: RuntimeSystem): Record<string, OpFactory> {
  return {
    'sys.define': new DefineOpFactory(runtime),
    'sys.call': new CallOpFactory(runtime),
    'sys.get': new GetConstOpFactory(runtime),
  };
}

import { z } from "zod";
import {
  SimpleFactory,
  type Op,
  evalOnContext,
  type OpOrVal,
  type OpFactory,
} from "@/lib/operator";
import { get } from "@/lib/object";

const ctxConf = z.any();

export class ContextOpFactory extends SimpleFactory<typeof ctxConf> {
  readonly schema = ctxConf;
  create(): Op {
    return (context) => context;
  }
}

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const arrayOrRecordConfig = z.array(z.any()).or(z.record(z.any()));

const getConfig = z.object({
  key: z.any(),
  from: z.any().optional(),
  default: z.any().optional(),
});

export class GetOpFactory extends SimpleFactory<typeof getConfig> {
  readonly schema = getConfig;
  create({ key, from, default: defaultValue }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      const resolvedKey = evalOnContext(key, context);
      const realKey = composedKeyConfig.parse(resolvedKey);
      const resolvedFrom = evalOnContext(from ?? context, context);
      const realFrom = arrayOrRecordConfig.parse(resolvedFrom);
      return get(realKey, realFrom, defaultValue);
    };
  }
}

const opConfig = z.function().args(z.any()).returns(z.any());

const pipeConfig = z.object({
  do: z.array(opConfig),
});

export class PipeOpFactory extends SimpleFactory<typeof pipeConfig> {
  readonly schema = pipeConfig;
  create({ do: operators }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      let result = context;
      for (const op of operators) {
        result = op(result);
      }
      return result;
    };
  }
}

const andConfig = z.object({
  conditions: z.array(z.any()),
});

export class AndOpFactory extends SimpleFactory<typeof andConfig> {
  readonly schema = andConfig;
  create({ conditions }: z.TypeOf<this["schema"]>): Op {
    return (context) => {
      let result: OpOrVal = false;
      for (const condition of conditions) {
        result = evalOnContext(condition, context);
        if (!result) {
          return result;
        }
      }
      return result;
    };
  }
}

const forkConfig = z.object({
  branches: z.array(z.any()).or(z.record(z.any())),
});

export class ForkOpFactory extends SimpleFactory<typeof forkConfig> {
  readonly schema = forkConfig;
  create({ branches }: z.TypeOf<this["schema"]>): Op {
    return Array.isArray(branches)
      ? (context) => {
          const result = new Array<OpOrVal>(branches.length);
          for (let i = 0; i < branches.length; i++) {
            result[i] = evalOnContext(branches[i], context);
          }
          return result;
        }
      : (context) => {
          const result: Record<string, OpOrVal> = {};
          for (const [key, value] of Object.entries(branches)) {
            result[key] = evalOnContext(value, context);
          }
          return result;
        };
  }
}

export function flowOperatorsFactories(): Record<string, OpFactory> {
  return {
    ctx: new ContextOpFactory(),
    get: new GetOpFactory(),
    pipe: new PipeOpFactory(),
    and: new AndOpFactory(),
    fork: new ForkOpFactory(),
  };
}

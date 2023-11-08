import { z } from "zod";
import {
  FactoryWithValidation,
  type Op,
  evalOnContext,
  type OpOrVal,
  type OpFactory,
  OpFactoryConfig,
} from "@/lib/operator";
import { get } from "@/lib/object";

const ctxConf = z.any();

export class ContextOpFactory extends FactoryWithValidation<typeof ctxConf> {
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

export class GetOpFactory extends FactoryWithValidation<typeof getConfig> {
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

export class PipeOpFactory extends FactoryWithValidation<typeof pipeConfig> {
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

export class AndOpFactory extends FactoryWithValidation<typeof andConfig> {
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

const evalConfig = z.object({
  value: z.any(),
  context: z.any(),
})

export class EvalOpFactory implements OpFactory {
  readonly schema = evalConfig;
  Create(config: OpFactoryConfig): OpOrVal {
    const { value, context } = this.schema.parse(config);
    return evalOnContext(value, context);
  }
}

export function flowOperatorsFactories(): Record<string, OpFactory> {
  return {
    ctx: new ContextOpFactory(),
    get: new GetOpFactory(),
    pipe: new PipeOpFactory(),
    and: new AndOpFactory(),
    eval: new EvalOpFactory(),
  };
}

import { z } from "zod";
import { evalInScope, FlowOpFactory, ScopedOp } from "@/lib/operator";
import { get } from "@/lib/object";
import { isObject, isRecord } from "../guards";

const ctxConf = z.any();

export class ContextOpFactory extends FlowOpFactory<typeof ctxConf, unknown> {
  readonly schema = ctxConf;
  create(): ScopedOp<unknown> {
    return (scope) => scope.context;
  }
}

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const arrayOrRecordConfig = z.array(z.unknown()).or(z.record(z.unknown()));

const getConfig = z.object({
  key: z.unknown(),
  from: z.unknown().optional(),
  default: z.unknown().optional(),
});

export class GetOpFactory extends FlowOpFactory<typeof getConfig, unknown> {
  readonly schema = getConfig;
  create({
    key,
    from,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const resolvedKey = await evalInScope(key, scope);
      const realKey = composedKeyConfig.parse(resolvedKey);
      const resolvedFrom = await evalInScope(from ?? scope.context, scope);
      const realFrom = arrayOrRecordConfig.parse(resolvedFrom);
      return get(realKey, realFrom, defaultValue);
    };
  }
}

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

const updateConfig = z.object({
  source: z.unknown(),
  properties: z.unknown(),
});

export class UpdateOpFactory extends FlowOpFactory<
  typeof updateConfig,
  Record<string, unknown> | Array<unknown>
> {
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

// const evalConfig = z.object({
//   value: z.unknown(),
//   scope: z
//     .object({
//       functions: z.record(z.unknown()).default({}),
//       constants: z.record(z.unknown()).default({}),
//       context: z.unknown().default(null),
//     })
//     .default({
//       constants: {},
//       functions: {},
//       context: null,
//     }),
// });

// export class EvalOpFactory extends BaseValFactory<typeof evalConfig, Promise<unknown>> {
//   readonly schema = evalConfig;
//   Create(config: unknown): Promise<unknown> {
//     const { value, scope } = this.schema.parse(config);
//     return evalInScope(value, scope);
//   }
// }

export function flowOperatorsFactories() {
  return {
    ctx: new ContextOpFactory(),
    get: new GetOpFactory(),
    pipe: new PipeOpFactory(),
    and: new AndOpFactory(),
    update: new UpdateOpFactory(),
  };
}

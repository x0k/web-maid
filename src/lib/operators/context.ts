import { z } from "zod";

import { isRecord, isObject } from "@/lib/guards";
import { get } from "@/lib/object";
import { FlowOpFactory, ScopedOp, evalInScope } from "@/lib/operator";

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

export function contextOperatorsFactories() {
  return {
    get: new GetOpFactory(),
    update: new UpdateOpFactory(),
  };
}

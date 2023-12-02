import { z } from "zod";

import { FlowOpFactory, ScopedOp, evalInScope } from "@/lib/operator";

const dummyConfig = z.unknown();

export class IndexOpFactory extends FlowOpFactory<typeof dummyConfig, number> {
  name = "index";
  schema = dummyConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {}`,
          returns: "number",
          description:
            "Returns the `index` of the current element in the processed `array`.\
Throws an error if called outside `array` method.",
        },
      ];
    }
  }
  protected create(): ScopedOp<number> {
    return (scope) => {
      if (scope.index === undefined) {
        throw new Error("Index is not defined");
      }
      return scope.index;
    };
  }
}

export class CurrentOpFactory extends FlowOpFactory<
  typeof dummyConfig,
  unknown[]
> {
  name = "current";
  schema = dummyConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {}`,
          returns: "unknown[]",
          description:
            "Returns the current `array`.\
Throws an error if called outside `array` method.",
        },
      ];
    }
  }
  protected create(): ScopedOp<unknown[]> {
    return (scope) => {
      if (scope.array === undefined) {
        throw new Error("Array is not defined");
      }
      return scope.array;
    };
  }
}

const findSchema = z.object({
  source: z.unknown().optional(),
  predicate: z.function(),
});

export class FindOpFactory extends FlowOpFactory<typeof findSchema, unknown> {
  name = "find";
  schema = findSchema;

  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  source?: unknown[]
  predicate: (value: unknown) => unknown
}`,
          returns: "unknown | null",
          description:
            "Finds an element in an array that matches the predicate. Returns `null` if not found.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: find$op: array.find
source: [1, 2, 3]
predicate:
  $op: eq
  left: 2
  right:
    $op: get`,
          result: "2",
        },
      ];
    }
  }

  protected create({
    source,
    predicate,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const array = source ? await evalInScope(source, scope) : scope.context;
      if (!Array.isArray(array)) {
        throw new Error("Source must be an array");
      }
      const mutableScope = { ...scope, array };
      for (let i = 0; i < array.length; i++) {
        mutableScope.index = i;
        mutableScope.context = array[i];
        if (await predicate(mutableScope)) {
          return array[i];
        }
      }
      return null;
    };
  }
}

export function arrayOperatorsFactories() {
  return [new IndexOpFactory(), new CurrentOpFactory(), new FindOpFactory()];
}

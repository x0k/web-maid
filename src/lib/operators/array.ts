import { z } from "zod";

import {
  FlowOpFactory,
  ScopedOp,
  TaskOpFactory,
  contextDefaultedFieldPatch,
  evalInScope,
} from "@/lib/operator";

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

export class ItemOfFactory extends FlowOpFactory<typeof dummyConfig, unknown> {
  name = "item";
  schema = dummyConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {}`,
          returns: "unknown",
          description: "Returns the current `item`",
        },
      ];
    }
  }
  protected create(): ScopedOp<unknown> {
    return (scope) => {
      if (scope.array === undefined) {
        throw new Error("Array is not defined");
      }
      if (scope.index === undefined) {
        throw new Error("Index is not defined");
      }
      return scope.array[scope.index];
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
  /** @default <context> */
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
          code: `$op: array.find
source: [1, 2, 3]
predicate:
  $op: eq
  left: 2
  right:
    $op: array.item`,
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
        if (await predicate(mutableScope)) {
          return array[i];
        }
      }
      return null;
    };
  }
}

const lengthConfig = z.object({
  value: z.array(z.unknown()).optional(),
});

export class LengthOpFactory extends FlowOpFactory<
  typeof lengthConfig,
  number
> {
  name = "length";
  schema = lengthConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  value?: unknown[]
}`,
          returns: "number",
          description: "Returns the length of `value`",
        },
      ];
    }
  }
  protected create({ value }: z.TypeOf<this["schema"]>): ScopedOp<number> {
    return async (scope) => {
      const array = value ? await evalInScope(value, scope) : scope.context;
      if (!Array.isArray(array)) {
        throw new Error("Value must be an array");
      }
      return array.length;
    };
  }
}

const indexOfConfig = z.object({
  source: z.array(z.unknown()),
  value: z.unknown(),
});

export class IndexOfOpFactory extends TaskOpFactory<
  typeof indexOfConfig,
  number
> {
  name = "indexOf";
  schema = indexOfConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  source?: unknown[]
  value: unknown
}`,
          returns: "number",
          description:
            "Returns the index of the first occurrence of a `value` in `source`, or -1 if it is not present.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("source");
  protected execute({ source, value }: z.TypeOf<this["schema"]>): number {
    return source.indexOf(value);
  }
}

const mapConfig = z.object({
  source: z.unknown(),
  mapper: z.unknown(),
});

export class MapOpFactory extends FlowOpFactory<typeof mapConfig, unknown[]> {
  name = "map";
  schema = mapConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  source?: unknown[]
  mapper: unknown
}`,
          returns: "unknown[]",
          description: "Maps `source` with `mapper`",
        },
      ];
    }
  }
  protected create({
    source,
    mapper,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown[]> {
    return async (scope) => {
      const array = source ? await evalInScope(source, scope) : scope.context;
      if (!Array.isArray(array)) {
        throw new Error("Source must be an array");
      }
      const result = new Array(array.length);
      const mutableScope = { ...scope, array };
      for (let i = 0; i < array.length; i++) {
        mutableScope.index = i;
        result[i] = await evalInScope(mapper, mutableScope);
      }
      return result;
    };
  }
}

const reduceConfig = z.object({
  source: z.unknown(),
  reducer: z.unknown(),
});

export class ReduceOpFactory extends FlowOpFactory<
  typeof reduceConfig,
  unknown
> {
  name = "reduce";
  schema = reduceConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  source?: unknown[]
  reducer: unknown
}`,
          returns: "unknown",
          description: "Reduces `source` with `reducer`",
        },
      ];
    }
  }
  protected create({
    source,
    reducer,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      const array = source ? await evalInScope(source, scope) : scope.context;
      if (!Array.isArray(array)) {
        throw new Error("Source must be an array");
      }
      const mutableScope = { ...scope, array };
      for (let i = 0; i < array.length; i++) {
        mutableScope.index = i;
        mutableScope.context = await evalInScope(reducer, mutableScope);
      }
      return mutableScope.context;
    };
  }
}

const sliceConfig = z.object({
  source: z.array(z.unknown()),
  start: z.number().default(0),
  end: z.number().optional(),
});

export class SliceOpFactory extends TaskOpFactory<
  typeof sliceConfig,
  unknown[]
> {
  name = "slice";
  schema = sliceConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  source?: unknown[]
  start?: number
  end?: number
}`,
          returns: "unknown[]",
          description: "Returns a slice of `source`",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("source");
  protected execute({
    source,
    start,
    end,
  }: z.TypeOf<this["schema"]>): unknown[] {
    return source.slice(start, end);
  }
}

const reverseConfig = z.object({
  source: z.array(z.unknown()),
});

export class ReverseOpFactory extends TaskOpFactory<
  typeof reverseConfig,
  unknown[]
> {
  name = "reverse";
  schema = reverseConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  source?: unknown[]
}`,
          returns: "unknown[]",
          description: "Reverses `source`",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("source");
  protected execute({ source }: z.TypeOf<this["schema"]>): unknown[] {
    return source.slice().reverse();
  }
}

export function arrayOperatorsFactories() {
  return [
    new LengthOpFactory(),
    new IndexOpFactory(),
    new ItemOfFactory(),
    new CurrentOpFactory(),
    new FindOpFactory(),
    new IndexOfOpFactory(),
    new MapOpFactory(),
    new ReduceOpFactory(),
    new SliceOpFactory(),
    new ReverseOpFactory(),
  ];
}

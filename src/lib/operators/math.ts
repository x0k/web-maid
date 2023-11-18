import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

const plusConfig = z
  .object({
    left: z.number(),
    right: z.number(),
  })
  .or(
    z.object({
      left: z.string(),
      right: z.string(),
    })
  );

export class PlusOpFactory extends TaskOpFactory<typeof plusConfig, unknown> {
  name = "plus";
  schema = plusConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    //@ts-expect-error typescript
    return config.left + config.right;
  }
}

const binaryConfig = z.object({
  left: z.number(),
  right: z.number(),
});

export class MinusOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  unknown
> {
  name = "minus";
  schema = binaryConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    return config.left - config.right;
  }
}

export class MultiplyOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  unknown
> {
  name = "mul";
  schema = binaryConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    return config.left * config.right;
  }
}

export class DivideOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  unknown
> {
  name = "div";
  schema = binaryConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    return config.left / config.right;
  }
}

export class ModuloOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  unknown
> {
  name = "mod";
  schema = binaryConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    return config.left % config.right;
  }
}

export class PowerOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  unknown
> {
  name = "pow";
  schema = binaryConfig;
  protected execute(config: z.TypeOf<this["schema"]>): unknown {
    return Math.pow(config.left, config.right);
  }
}

export function mathOperatorsFactories() {
  return [
    new PlusOpFactory(),
    new MinusOpFactory(),
    new MultiplyOpFactory(),
    new DivideOpFactory(),
    new ModuloOpFactory(),
    new PowerOpFactory(),
  ];
}

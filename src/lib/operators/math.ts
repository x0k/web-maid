import { z } from "zod";

import { OpSignature, TaskOpFactory } from "@/lib/operator";

const binaryConfig = z.object({
  left: z.number(),
  right: z.number(),
});

function binOpSignatures(description: string): OpSignature[] {
  return [
    {
      params: `interface Config {
  left: number;
  right: number;
}`,
      returns: "number",
      description,
    },
  ];
}

export class PlusOpFactory extends TaskOpFactory<typeof binaryConfig, number> {
  name = "plus";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the sum of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left + config.right;
  }
}

export class MinusOpFactory extends TaskOpFactory<typeof binaryConfig, number> {
  name = "minus";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the difference of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left - config.right;
  }
}

export class MultiplyOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  number
> {
  name = "mul";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the product of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left * config.right;
  }
}

export class DivideOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  number
> {
  name = "div";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the quotient of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left / config.right;
  }
}

export class ModuloOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  number
> {
  name = "mod";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the remainder of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left % config.right;
  }
}

export class PowerOpFactory extends TaskOpFactory<typeof binaryConfig, number> {
  name = "pow";
  schema = binaryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = binOpSignatures(
        "Returns the power of `left` and `right`."
      );
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): number {
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

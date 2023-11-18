import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

const binaryConfig = z.object({
  left: z.number(),
  right: z.number(),
});


function binaryOperatorSignature(name: string) {
  return `interface BinaryOperatorConfig {
  left: number;
  right: number;
}
function ${name}(config: BinaryOperatorConfig): number`
}

export class PlusOpFactory extends TaskOpFactory<typeof binaryConfig, number> {
  name = "plus";
  schema = binaryConfig;
  signature = binaryOperatorSignature("plus");
  description = 'Returns the sum of `left` and `right`.'
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left + config.right;
  }
}

export class MinusOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  number
> {
  name = "minus";
  schema = binaryConfig;
  signature = binaryOperatorSignature("minus");
  description = 'Returns the difference of `left` and `right`.'
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
  signature = binaryOperatorSignature("mul");
  description = 'Returns the product of `left` and `right`.'
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
  signature = binaryOperatorSignature("div");
  description = 'Returns the quotient of `left` and `right`.'
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
  signature = binaryOperatorSignature("mod");
  description = 'Returns the remainder of `left` and `right`.'
  protected execute(config: z.TypeOf<this["schema"]>): number {
    return config.left % config.right;
  }
}

export class PowerOpFactory extends TaskOpFactory<
  typeof binaryConfig,
  number
> {
  name = "pow";
  schema = binaryConfig;
  signature = binaryOperatorSignature("pow");
  description = 'Returns the power of `left` and `right`.'
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

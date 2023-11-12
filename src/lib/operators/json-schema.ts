import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";
import { AsyncFactory } from "@/lib/factory";

const validateConfig = z.object({
  schema: z.record(z.unknown()),
  data: z.unknown(),
});

export interface AsyncValidatorData {
  schema: Record<string, unknown>;
  data: unknown;
}

export class ValidateOpFactory extends TaskOpFactory<
  typeof validateConfig,
  boolean
> {
  schema = validateConfig;

  constructor(
    private readonly asyncValidator: AsyncFactory<AsyncValidatorData, boolean>
  ) {
    super();
  }

  protected execute({
    schema,
    data,
  }: z.TypeOf<this["schema"]>): Promise<boolean> {
    return this.asyncValidator.Create({ schema, data });
  }
}

export function jsonSchemaOperatorsFactories(
  asyncValidator: AsyncFactory<AsyncValidatorData, boolean>
) {
  return {
    validate: new ValidateOpFactory(asyncValidator),
  };
}

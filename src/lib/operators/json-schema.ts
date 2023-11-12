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

const formConfig = z.object({
  schema: z.record(z.unknown()),
  uiSchema: z.record(z.unknown()).optional(),
  data: z.unknown().optional(),
  omitExtraData: z.boolean().optional(),
});

export type ShowFormData = z.infer<typeof formConfig>;

export class FormOpFactory extends TaskOpFactory<typeof formConfig, unknown> {
  schema = formConfig;
  constructor(
    private readonly formShower: AsyncFactory<ShowFormData, unknown>
  ) {
    super();
  }
  protected execute(config: z.TypeOf<this["schema"]>): Promise<unknown> {
    return this.formShower.Create(config);
  }
}

export function jsonSchemaOperatorsFactories(
  asyncValidator: AsyncFactory<AsyncValidatorData, boolean>,
  formShower: AsyncFactory<ShowFormData, unknown>
) {
  return {
    validate: new ValidateOpFactory(asyncValidator),
    form: new FormOpFactory(formShower),
  };
}

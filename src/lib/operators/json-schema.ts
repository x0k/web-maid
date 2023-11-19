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
  name = "validate";
  schema = validateConfig;

  constructor(
    private readonly asyncValidator: AsyncFactory<AsyncValidatorData, boolean>
  ) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  schema: Record<string, unknown>
  data: <json>
}`,
          returns: `boolean`,
          description:
            "Validates a `<json>` value against a provided JSON schema.",
        },
      ];
    }
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
  name = "form";
  schema = formConfig;
  constructor(
    private readonly formShower: AsyncFactory<ShowFormData, unknown>
  ) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  schema: Record<string, unknown>
  uiSchema?: Record<string, unknown>
  data?: <json>
  omitExtraData?: boolean
}`,
          returns: `<json>`,
          description:
            "Shows a form constructed from a provided JSON and UI schemas. \
It returns a `<json>` value of the form after the form is submitted.",
        },
      ];
    }
  }
  protected execute(config: z.TypeOf<this["schema"]>): Promise<unknown> {
    return this.formShower.Create(config);
  }
}

export function jsonSchemaOperatorsFactories(
  asyncValidator: AsyncFactory<AsyncValidatorData, boolean>,
  formShower: AsyncFactory<ShowFormData, unknown>
) {
  return [new ValidateOpFactory(asyncValidator), new FormOpFactory(formShower)];
}

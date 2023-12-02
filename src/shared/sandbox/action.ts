import type { RJSFSchema, UiSchema, ValidationData } from "@rjsf/utils";

import type { Request } from "@/lib/actor";

export enum SandboxActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
  Validate = "schema::validate",
  ValidateSchema = "schema::validateSchema",
  ValidateFormData = "formData::validate",
}

export interface AbstractSandboxAction<T extends SandboxActionType>
  extends Request<T> {}

export interface RenderTemplateAction
  extends AbstractSandboxAction<SandboxActionType.RenderTemplate> {
  template: string;
  data: unknown;
}

export interface RunEvalAction
  extends AbstractSandboxAction<SandboxActionType.RunEval> {
  expression: string;
  data: unknown;
  injectAs: "context" | "scope";
}

export interface ValidateAction
  extends AbstractSandboxAction<SandboxActionType.Validate> {
  schema: Record<string, unknown>;
  data: unknown;
}

export interface ValidateSchemaAction
  extends AbstractSandboxAction<SandboxActionType.ValidateSchema> {
  schema: Record<string, unknown>;
}

export interface ValidateFormDataAction<T>
  extends AbstractSandboxAction<SandboxActionType.ValidateFormData> {
  formData: T | undefined;
  schema: RJSFSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: UiSchema<T, RJSFSchema, any>;
}

export type SandboxAction<T = unknown> =
  | RenderTemplateAction
  | RunEvalAction
  | ValidateAction
  | ValidateSchemaAction
  | ValidateFormDataAction<T>;

export interface SandboxActionResults<T = unknown> {
  [SandboxActionType.RenderTemplate]: string;
  [SandboxActionType.RunEval]: unknown;
  [SandboxActionType.Validate]: boolean;
  [SandboxActionType.ValidateSchema]: boolean;
  [SandboxActionType.ValidateFormData]: ValidationData<T>;
}

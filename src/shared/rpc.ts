import type { RJSFSchema, UiSchema, ValidationData } from "@rjsf/utils";

export enum ActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
  Validate = "schema::validate",
  ValidateSchema = "schema::validateSchema",
  ValidateFormData = "formData::validate",
}

export interface AbstractAction<T extends ActionType> {
  id: string;
  type: T;
}

export interface RenderTemplateAction
  extends AbstractAction<ActionType.RenderTemplate> {
  template: string;
  data: unknown;
}

export interface RunEvalAction extends AbstractAction<ActionType.RunEval> {
  expression: string;
}

export interface ValidateAction extends AbstractAction<ActionType.Validate> {
  schema: Record<string, unknown>;
  data: unknown;
}

export interface ValidateSchemaAction
  extends AbstractAction<ActionType.ValidateSchema> {
  schema: Record<string, unknown>;
}

export interface ValidateFormDataAction<T>
  extends AbstractAction<ActionType.ValidateFormData> {
  formData: T | undefined;
  schema: RJSFSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: UiSchema<T, RJSFSchema, any>;
}

export type Action<T = unknown> =
  | RenderTemplateAction
  | RunEvalAction
  | ValidateAction
  | ValidateSchemaAction
  | ValidateFormDataAction<T>;

export interface ActionResults<T = unknown> {
  [ActionType.RenderTemplate]: string;
  [ActionType.RunEval]: unknown;
  [ActionType.Validate]: boolean;
  [ActionType.ValidateSchema]: boolean;
  [ActionType.ValidateFormData]: ValidationData<T>;
}

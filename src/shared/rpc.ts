import type { RJSFSchema, UiSchema, ValidationData } from "@rjsf/utils";

export enum ActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
  ValidateSchema = "schema::validate",
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
  | ValidateSchemaAction
  | ValidateFormDataAction<T>;

export interface ActionResults<T = unknown> {
  [ActionType.RenderTemplate]: string;
  [ActionType.ValidateSchema]: boolean;
  [ActionType.RunEval]: unknown;
  [ActionType.ValidateFormData]: ValidationData<T>;
}

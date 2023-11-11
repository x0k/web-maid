export enum ActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
  ValidateSchema = "schema::validate",
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

export interface ValidateSchema
  extends AbstractAction<ActionType.ValidateSchema> {
  schema: Record<string, unknown>;
}

export type Action = RenderTemplateAction | RunEvalAction | ValidateSchema;

export interface ActionResults {
  [ActionType.RenderTemplate]: string;
  [ActionType.ValidateSchema]: boolean;
  [ActionType.RunEval]: unknown;
}

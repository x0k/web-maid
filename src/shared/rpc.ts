export enum ActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
}

export interface AbstractAction<T extends ActionType> {
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

export type Action = RenderTemplateAction | RunEvalAction;

export interface ActionResults {
  [ActionType.RenderTemplate]: string;
  [ActionType.RunEval]: unknown;
}

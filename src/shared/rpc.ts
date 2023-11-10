import { nanoid } from "nanoid/non-secure";

import type { TemplateRendererData } from "@/lib/operators/ext";
import type { IRemoteActor } from "@/lib/actor";
import type { AsyncFactory } from "@/lib/factory";

import type { ConfigRenderedData } from "./extension";

export enum ActionType {
  RenderTemplate = "template::render",
  RunEval = "eval::run",
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

export type Action = RenderTemplateAction | RunEvalAction;

export interface ActionResults {
  [ActionType.RenderTemplate]: string;
  [ActionType.RunEval]: unknown;
}

export class Evaluator implements AsyncFactory<string, unknown> {
  constructor(private readonly actor: IRemoteActor<Action, ActionResults>) {}
  Create(expression: string) {
    return this.actor.call({
      id: nanoid(),
      type: ActionType.RunEval,
      expression,
    });
  }
}

export class Renderer implements AsyncFactory<TemplateRendererData, string> {
  constructor(private readonly actor: IRemoteActor<Action, ActionResults>) {}
  Create(config: TemplateRendererData): Promise<string> {
    return this.actor.call({
      id: nanoid(),
      type: ActionType.RenderTemplate,
      template: config.template,
      data: config.data,
    });
  }
}

export class ConfigRendered
  implements AsyncFactory<ConfigRenderedData, string>
{
  constructor(private readonly actor: IRemoteActor<Action, ActionResults>) {}
  Create(config: ConfigRenderedData): Promise<string> {
    return this.actor.call({
      id: nanoid(),
      type: ActionType.RenderTemplate,
      template: config.configTemplate,
      data: config.configData,
    });
  }
}

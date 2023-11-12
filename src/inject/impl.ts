import { nanoid } from "nanoid";

import { ActorId, IRemoteActor } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { TemplateRendererData } from "@/lib/operators/template";
import { AsyncValidatorData } from "@/lib/operators/json-schema";

import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "@/shared/sandbox/action";

export class Evaluator implements AsyncFactory<string, unknown> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(expression: string) {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.RunEval,
      expression,
    });
  }
}

export class Renderer implements AsyncFactory<TemplateRendererData, string> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(config: TemplateRendererData): Promise<string> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.RenderTemplate,
      template: config.template,
      data: config.data,
    });
  }
}

export class Validator implements AsyncFactory<AsyncValidatorData, boolean> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(config: AsyncValidatorData): Promise<boolean> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.Validate,
      schema: config.schema,
      data: config.data,
    });
  }
}

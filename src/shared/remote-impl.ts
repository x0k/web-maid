import { nanoid } from "nanoid/non-secure";

import { ActorId, IRemoteActor } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { TemplateRendererData } from "@/lib/operators/template";
import { AsyncValidatorData, ShowFormData } from "@/lib/operators/json-schema";
import { FetcherData } from "@/lib/operators/http";
import { ILogger } from "@/lib/logger";
import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "@/shared/sandbox/action";

import {
  ExtensionAction,
  ExtensionActionResults,
  ExtensionActionType,
} from "./action";

export class RemoteEvaluator implements AsyncFactory<string, unknown> {
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

export class RemoteRenderer
  implements AsyncFactory<TemplateRendererData, string>
{
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

export class RemoteValidator
  implements AsyncFactory<AsyncValidatorData, boolean>
{
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

export class RemoteFormShower implements AsyncFactory<ShowFormData, unknown> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      ExtensionAction,
      ExtensionActionResults
    >
  ) {}
  Create(config: ShowFormData): Promise<unknown> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: ExtensionActionType.ShowFrom,
      schema: config.schema,
      uiSchema: config.uiSchema,
      data: config.data,
      omitExtraData: config.omitExtraData,
    });
  }
}

export class RemoteLogger implements ILogger {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      ExtensionAction,
      ExtensionActionResults
    >
  ) {}

  log(arg: unknown): void {
    this.actor.call({
      id: nanoid(),
      handlerId: this.handlerId,
      type: ExtensionActionType.AppendLog,
      log: arg,
    });
  }
}

export class RemoteFetcher implements AsyncFactory<FetcherData, unknown> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      ExtensionAction,
      ExtensionActionResults
    >
  ) {}
  Create(config: FetcherData): Promise<unknown> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: ExtensionActionType.MakeRequest,
      url: config.url,
      method: config.method,
      headers: config.headers,
      body: config.body,
      as: config.as,
    });
  }
}

import { nanoid } from "nanoid/non-secure";

import { ActorId, IRemoteActor, MessageType } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { ShowFormData } from "@/lib/operators/json-schema";
import { FetcherData } from "@/lib/operators/http";
import { ILogger } from "@/lib/logger";

import {
  ExtensionAction,
  ExtensionActionResults,
  ExtensionActionType,
} from "./action";

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
      type: MessageType.Request,
      request: {
        type: ExtensionActionType.ShowFrom,
        schema: config.schema,
        uiSchema: config.uiSchema,
        data: config.data,
        omitExtraData: config.omitExtraData,
      },
    });
  }
}

export class RemoteOkShower implements AsyncFactory<string, void> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      ExtensionAction,
      ExtensionActionResults
    >
  ) {}
  Create(message: string): Promise<void> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: MessageType.Request,
      request: {
        type: ExtensionActionType.ShowOk,
        message,
      },
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
      type: MessageType.Request,
      request: {
        type: ExtensionActionType.AppendLog,
        log: arg,
      },
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
      type: MessageType.Request,
      request: {
        type: ExtensionActionType.MakeRequest,
        url: config.url,
        method: config.method,
        headers: config.headers,
        body: config.body,
        as: config.as,
      },
    });
  }
}

import { nanoid } from "nanoid";

import { ActorId, IRemoteActor, MessageType } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { FetcherData } from "@/lib/operators/http";

import {
  BackgroundAction,
  BackgroundActionResults,
  BackgroundActionType,
} from "./action";
import { DownloaderData } from '@/lib/operators/fs';

export class RemoteFetcher implements AsyncFactory<FetcherData, unknown> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      BackgroundAction,
      BackgroundActionResults
    >
  ) {}
  Create(config: FetcherData): Promise<unknown> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: MessageType.Request,
      request: {
        type: BackgroundActionType.MakeRequest,
        url: config.url,
        method: config.method,
        headers: config.headers,
        body: config.body,
        as: config.as,
      },
    });
  }
}

export class RemoteDownloader implements AsyncFactory<DownloaderData, void> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      BackgroundAction,
      BackgroundActionResults
    >
  ) {}
  Create(config: DownloaderData): Promise<void> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: MessageType.Request,
      request: {
        type: BackgroundActionType.StartDownload,
        content: config.content,
        filename: config.filename,
        mimeType: config.type,
      },
    });
  }
}
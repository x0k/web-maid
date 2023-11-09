interface Typed<T extends string> {
  id: string;
  type: T;
}

enum MessageType {
  Loaded = "loaded",
  Success = "success",
  Error = "error",
}

interface AbstractMessage<T extends MessageType> {
  type: T;
}

interface LoadedMessage extends AbstractMessage<MessageType.Loaded> {}

interface AbstractResponseMessage<
  I extends Typed<string>,
  T extends MessageType
> extends AbstractMessage<T> {
  requestId: I["id"];
}

interface SuccessMessage<
  I extends Typed<string>,
  R extends Record<string, unknown>
> extends AbstractResponseMessage<I, MessageType.Success> {
  result: R[I["type"]];
}

interface ErrorMessage<I extends Typed<string>, E>
  extends AbstractResponseMessage<I, MessageType.Error> {
  error: E;
}

type ActorMessage<
  I extends Typed<string>,
  R extends Record<string, unknown>,
  E
> = LoadedMessage | SuccessMessage<I, R> | ErrorMessage<I, E>;

export interface IActor<
  I extends Typed<string>,
  R extends Record<I["type"], unknown>,
  E
> {
  handle(msg: I): Promise<R[I["type"]]>;
  toError(error: unknown): E;
}

export abstract class AbstractSandboxActor<
  I extends Typed<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IActor<I, R, E>
{
  abstract handle(msg: I): Promise<R[I["type"]]>;
  abstract toError(error: unknown): E;

  private reply(evt: MessageEvent<I>, msg: ActorMessage<I, R, E>) {
    (evt.source as WindowProxy).postMessage(msg, evt.origin);
  }

  private broadcast(msg: ActorMessage<I, R, E>) {
    this.window.parent.postMessage(msg, "*");
  }

  private async handleMessageEvent(event: MessageEvent<I>) {
    try {
      const result = await this.handle(event.data);
      if (result !== undefined) {
        this.reply(event, {
          requestId: event.data.id,
          type: MessageType.Success,
          result,
        });
      }
    } catch (e) {
      this.reply(event, {
        requestId: event.data.id,
        type: MessageType.Error,
        error: this.toError(e),
      });
    }
  }

  constructor(protected readonly window: Window) {
    this.window.addEventListener("message", this.handleMessageEvent.bind(this));
  }

  loaded() {
    this.broadcast({ type: MessageType.Loaded });
  }
}

export interface IRemoteActor<
  I extends Typed<string>,
  R extends Record<I["type"], unknown>
> {
  call(msg: I): Promise<R[I["type"]]>;
}

export class RemoteActor<
  I extends Typed<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IRemoteActor<I, R>
{
  private readonly callbacks = new Map<
    string,
    {
      resolve: (value: R[I["type"]] | PromiseLike<R[I["type"]]>) => void;
      reject: (reason: E) => void;
    }
  >();

  private handleMessageEvent({ data }: MessageEvent<ActorMessage<I, R, E>>) {
    if (data.type === MessageType.Loaded) {
      return;
    }
    const resolvers = this.callbacks.get(data.requestId);
    if (!resolvers) {
      return;
    }
    this.callbacks.delete(data.requestId);
    switch (data.type) {
      case MessageType.Success:
        return resolvers.resolve(data.result);
      case MessageType.Error:
        return resolvers.reject(data.error);
    }
  }

  constructor(protected readonly sandbox: HTMLIFrameElement) {}

  async call(msg: I): Promise<R[I["type"]]> {
    return new Promise((resolve, reject) => {
      if (this.callbacks.has(msg.id)) {
        reject(new Error("Duplicate request id"));
        return;
      }
      const cw = this.sandbox.contentWindow;
      if (!cw) {
        reject(new Error("No content window"));
        return;
      }
      this.callbacks.set(msg.id, { resolve, reject });
      cw.postMessage(msg, "*");
    });
  }

  listen(window: Window) {
    window.addEventListener("message", this.handleMessageEvent.bind(this));
  }
}

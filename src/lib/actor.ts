enum MessageType {
  Loaded = "loaded",
  Success = "success",
  Error = "error",
}

interface AbstractMessage<T extends MessageType> {
  type: T;
}

interface LoadedMessage extends AbstractMessage<MessageType.Loaded> {}

export interface Request<T extends string> {
  id: string;
  type: T;
}

interface AbstractResponseMessage<
  I extends Request<string>,
  T extends MessageType
> extends AbstractMessage<T> {
  requestId: I["id"];
}

interface SuccessMessage<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> extends AbstractResponseMessage<I, MessageType.Success> {
  result: R[I["type"]];
}

interface ErrorMessage<I extends Request<string>, E>
  extends AbstractResponseMessage<I, MessageType.Error> {
  error: E;
}

type ActorMessage<
  I extends Request<string>,
  R extends Record<string, unknown>,
  E
> = LoadedMessage | SuccessMessage<I, R> | ErrorMessage<I, E>;

export interface IActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> {
  handle<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]>;
  castError(error: unknown): E;
}

export abstract class AbstractSandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IActor<I, R, E>
{
  abstract handle<T extends I["type"]>(
    msg: Extract<I, Request<T>>
  ): Promise<R[T]>;
  abstract castError(error: unknown): E;

  private reply(evt: MessageEvent<I>, msg: ActorMessage<I, R, E>) {
    (evt.source as WindowProxy).postMessage(msg, evt.origin);
  }

  private broadcast(msg: ActorMessage<I, R, E>) {
    this.window.parent.postMessage(msg, "*");
  }

  private async handleMessageEvent<T extends I["type"]>(
    event: MessageEvent<Extract<I, Request<T>>>
  ) {
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
        error: this.castError(e),
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

export class GenSandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractSandboxActor<I, R, E> {
  constructor(
    window: Window,
    private readonly handlers: {
      [K in I["type"]]: (msg: Extract<I, Request<K>>) => R[K];
    },
    private readonly toError: (e: unknown) => E
  ) {
    super(window);
  }

  async handle<M extends I["type"]>(
    msg: Extract<I, Request<M>>
  ): Promise<R[M]> {
    const handler = this.handlers[msg.type];
    if (!handler) {
      throw new Error(`Unknown message type: ${msg.type}`);
    }
    return handler(msg);
  }

  castError(error: unknown): E {
    return this.toError(error);
  }
}

export interface IRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> {
  call<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]>;
}

type RequestResolver<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> = (value: R[I["type"]] | PromiseLike<R[I["type"]]>) => void;

export class RemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IRemoteActor<I, R>
{
  private readonly callbacks = new Map<
    I['id'],
    {
      resolve: RequestResolver<I, R>;
      reject: (reason: E) => void;
    }
  >();

  private isAllowedMessage(
    msg: ActorMessage<I, R, E>
  ): msg is SuccessMessage<I, R> | ErrorMessage<I, E> {
    return msg.type === MessageType.Success || msg.type === MessageType.Error;
  }

  private handleMessageEvent({ data }: MessageEvent<ActorMessage<I, R, E>>) {
    if (!this.isAllowedMessage(data)) {
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

  async call<T extends I["type"]>(
    msg: Extract<I, Request<T>>
  ): Promise<R[T]> {
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
      this.callbacks.set(msg.id, {
        resolve: resolve as RequestResolver<I, R>,
        reject,
      });
      cw.postMessage(msg, "*");
    });
  }

  listen(window: Window) {
    window.addEventListener("message", this.handleMessageEvent.bind(this));
  }
}

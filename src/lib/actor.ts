export type ActorId = string;

export enum MessageType {
  Loaded = "loaded",
  Success = "success",
  Error = "error",
}

export interface AbstractMessage<T extends MessageType> {
  type: T;
}

export interface LoadedMessage extends AbstractMessage<MessageType.Loaded> {
  id: ActorId;
}

export interface Request<T extends string> {
  id: string;
  handlerId: ActorId;
  type: T;
}

export interface AbstractResponseMessage<
  I extends Request<string>,
  T extends MessageType
> extends AbstractMessage<T> {
  requestId: I["id"];
}

export interface SuccessMessage<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> extends AbstractResponseMessage<I, MessageType.Success> {
  result: R[I["type"]];
}

export interface ErrorMessage<I extends Request<string>, E>
  extends AbstractResponseMessage<I, MessageType.Error> {
  error: E;
}

export type ResponseMessage<
  I extends Request<string>,
  R extends Record<string, unknown>,
  E
> = SuccessMessage<I, R> | ErrorMessage<I, E>;

export type ActorMessage<
  I extends Request<string>,
  R extends Record<string, unknown>,
  E
> = LoadedMessage | ResponseMessage<I, R, E>;

export interface IActorLogic<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> {
  handle<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]>;
  castError(error: unknown): E;
}

export interface IActor {
  start(): void;
}

export interface IRemoteActorLogic<E> {
  castError(error: unknown): E;
}

export interface IRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> {
  call<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]>;
}

export function isResponseMessage<
  I extends Request<string>,
  R extends Record<string, unknown>,
  E
>(msg: ActorMessage<I, R, E>): msg is ResponseMessage<I, R, E> {
  return msg.type === MessageType.Error || msg.type === MessageType.Success;
}

export function makeActorLogic<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
>(
  handlers: { [K in I["type"]]: (msg: Extract<I, Request<K>>) => R[K] },
  castError: (e: unknown) => E
): IActorLogic<I, R, E> {
  return {
    handle(msg) {
      return Promise.resolve(handlers[msg.type](msg));
    },
    castError,
  };
}

export function makeRemoteActorLogic<E>(
  castError: (e: unknown) => E
): IRemoteActorLogic<E> {
  return {
    castError,
  };
}

type RequestResolver<
  I extends Request<string>,
  R extends Record<I["type"], unknown>
> = (value: R[I["type"]] | PromiseLike<R[I["type"]]>) => void;

export abstract class AbstractActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IActor
{
  protected abstract listen(): void;
  protected abstract broadcast(msg: LoadedMessage): void;

  protected async handleRequest<T extends I["type"]>(
    req: Extract<I, Request<T>>,
    reply: <T extends I["type"]>(
      response: ResponseMessage<Extract<I, Request<T>>, R, E>
    ) => void
  ) {
    if (req.handlerId !== this.id) {
      return;
    }
    try {
      const result = await this.logic.handle(req);
      if (result !== undefined) {
        reply({
          requestId: req.id,
          type: MessageType.Success,
          result,
        });
      }
    } catch (e) {
      reply({
        requestId: req.id,
        type: MessageType.Error,
        error: this.logic.castError(e),
      });
    }
  }

  constructor(
    protected readonly id: ActorId,
    protected readonly logic: IActorLogic<I, R, E>
  ) {}

  start() {
    this.listen();
    this.broadcast({ type: MessageType.Loaded, id: this.id });
  }
}

export abstract class AbstractRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IRemoteActor<I, R>
{
  protected abstract sendRequest<T extends I["type"]>(
    req: Extract<I, Request<T>>
  ): void;

  private readonly callbacks = new Map<
    I["id"],
    {
      resolve: RequestResolver<I, R>;
      reject: (reason: E) => void;
    }
  >();

  protected handleMessage(data: ActorMessage<I, R, E>) {
    if (!isResponseMessage(data)) {
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

  constructor(protected readonly logic: IRemoteActorLogic<E>) {}

  async call<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]> {
    const promise = new Promise<R[T]>((resolve, reject) => {
      if (this.callbacks.has(msg.id)) {
        reject(this.logic.castError(new Error("Duplicate request id")));
        return;
      }
      this.callbacks.set(msg.id, {
        resolve: resolve as RequestResolver<I, R>,
        reject,
      });
    });
    this.sendRequest(msg);
    return promise;
  }
}

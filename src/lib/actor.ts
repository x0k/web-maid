export enum MessageType {
  Loaded = "loaded",
  Success = "success",
  Error = "error",
}

export interface AbstractMessage<T extends MessageType> {
  type: T;
}

export interface LoadedMessage extends AbstractMessage<MessageType.Loaded> {}

export interface Request<T extends string> {
  id: string;
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

export type ActorMessage<
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

export abstract class AbstractRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IRemoteActor<I, R>
{
  protected abstract sendRequest<T extends I["type"]>(
    req: Extract<I, Request<T>>
  ): void;

  private isAllowedMessage(
    msg: ActorMessage<I, R, E>
  ): msg is SuccessMessage<I, R> | ErrorMessage<I, E> {
    return msg.type === MessageType.Success || msg.type === MessageType.Error;
  }

  private readonly callbacks = new Map<
    I["id"],
    {
      resolve: RequestResolver<I, R>;
      reject: (reason: E) => void;
    }
  >();

  protected handleMessage(data: ActorMessage<I, R, E>) {
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

  constructor(protected readonly toError: (e: unknown) => E) {}

  async call<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]> {
    const promise = new Promise<R[T]>((resolve, reject) => {
      if (this.callbacks.has(msg.id)) {
        reject(this.toError(new Error("Duplicate request id")));
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

interface Typed<T extends string> {
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

interface SuccessMessage<
  I extends Typed<string>,
  R extends Record<string, unknown>
> extends AbstractMessage<MessageType.Success> {
  request: I;
  result: R[I["type"]];
}

interface ErrorMessage<I, E> extends AbstractMessage<MessageType.Error> {
  request: I;
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
          type: MessageType.Success,
          request: event.data,
          result,
        });
      }
    } catch (e) {
      this.reply(event, {
        type: MessageType.Error,
        request: event.data,
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

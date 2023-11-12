import {
  Request,
  AbstractRemoteActor,
  MessageType,
  IActor,
  ActorMessage,
} from "@/lib/actor";

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

export class SandboxRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractRemoteActor<I, R, E> {
  protected sendRequest<T extends I["type"]>(
    req: Extract<I, Request<T>>
  ): void {
    const cw = this.sandbox.contentWindow;
    if (!cw) {
      this.handleMessage({
        requestId: req.id,
        type: MessageType.Error,
        error: this.toError(new Error("No content window")),
      });
      return;
    }
    cw.postMessage(req, "*");
  }

  private handleMessageEvent({ data }: MessageEvent<ActorMessage<I, R, E>>) {
    this.handleMessage(data);
  }

  constructor(
    protected readonly sandbox: HTMLIFrameElement,
    toError: (e: unknown) => E
  ) {
    super(toError);
  }

  listen(window: Window) {
    window.addEventListener("message", this.handleMessageEvent.bind(this));
  }
}

import {
  Request,
  AbstractRemoteActor,
  MessageType,
  ActorMessage,
  ActorId,
  AbstractActor,
  ResponseMessage,
} from "@/lib/actor";

export abstract class AbstractSandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractActor<I, R, E> {
  private messageEvents = new Map<I["id"], MessageEvent<I>>();

  protected broadcast(msg: ActorMessage<I, R, E>) {
    this.window.parent.postMessage(msg, "*");
  }

  protected reply<T extends I["type"]>(
    response: ResponseMessage<Extract<I, Request<T>>, R, E>
  ): void {
    const event = this.messageEvents.get(response.requestId);
    if (event) {
      (event.source as WindowProxy).postMessage(response, event.origin);
    } else {
      throw new Error(`No message event for ${response.requestId}`);
    }
  }

  private async handleMessageEvent<T extends I["type"]>(
    event: MessageEvent<Extract<I, Request<T>>>
  ) {
    this.messageEvents.set(event.data.id, event);
    try {
      await this.handleRequest(event.data);
    } catch (e) {
      console.error(e);
    } finally {
      this.messageEvents.delete(event.data.id);
    }
  }

  protected listen() {
    this.window.addEventListener("message", this.handleMessageEvent.bind(this));
  }

  constructor(
    protected readonly id: ActorId,
    protected readonly window: Window
  ) {
    super(id);
  }
}

export class GenSandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractSandboxActor<I, R, E> {
  constructor(
    id: ActorId,
    window: Window,
    private readonly handlers: {
      [K in I["type"]]: (msg: Extract<I, Request<K>>) => R[K];
    },
    private readonly toError: (e: unknown) => E
  ) {
    super(id, window);
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

import {
  Request,
  AbstractRemoteActor,
  MessageType,
  ActorMessage,
  ActorId,
  AbstractActor,
  ResponseMessage,
  IActorLogic,
  IRemoteActorLogic,
} from "@/lib/actor";

export class SandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractActor<I, R, E> {
  protected broadcast(msg: ActorMessage<I, R, E>) {
    this.window.parent.postMessage(msg, "*");
  }

  private makeReply<T extends I["type"]>(
    event: MessageEvent<Extract<I, Request<T>>>
  ) {
    return (response: ResponseMessage<Extract<I, Request<T>>, R, E>) => {
      (event.source as WindowProxy).postMessage(response, event.origin);
    };
  }

  private handleMessageEvent = <T extends I["type"]>(
    event: MessageEvent<Extract<I, Request<T>>>
  ) => {
    //@ts-expect-error TODO: fix types
    this.handleRequest(event.data, this.makeReply(event));
  };

  protected listen() {
    this.window.addEventListener("message", this.handleMessageEvent);
  }

  constructor(
    id: ActorId,
    logic: IActorLogic<I, R, E>,
    protected readonly window: Window
  ) {
    super(id, logic);
  }

  stop(): void {
    this.window.removeEventListener("message", this.handleMessageEvent);
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
        error: this.logic.castError(new Error("No content window")),
      });
      return;
    }
    cw.postMessage(req, "*");
  }

  private handleMessageEvent({ data }: MessageEvent<ActorMessage<I, R, E>>) {
    this.handleMessage(data);
  }

  constructor(
    logic: IRemoteActorLogic<E>,
    protected readonly sandbox: HTMLIFrameElement
  ) {
    super(logic);
  }

  listen(window: Window) {
    window.addEventListener("message", this.handleMessageEvent.bind(this));
  }
}

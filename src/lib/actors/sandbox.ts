import {
  Request,
  AbstractRemoteActor,
  MessageType,
  ActorMessage,
  AbstractActor,
  ResponseMessage,
  IRemoteActorLogic,
} from "@/lib/actor";

export class SandboxActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractActor<I, R, E> {
  protected broadcast(msg: ActorMessage<I, R, E>) {
    window.parent.postMessage(msg, "*");
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
    window.addEventListener("message", this.handleMessageEvent);
  }

  stop(): void {
    window.removeEventListener("message", this.handleMessageEvent);
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

  private handleMessageEvent = ({
    data,
  }: MessageEvent<ActorMessage<I, R, E>>) => {
    this.handleMessage(data);
  };

  constructor(
    logic: IRemoteActorLogic<E>,
    private readonly sandbox: HTMLIFrameElement
  ) {
    super(logic);
  }

  start(): void {
    window.addEventListener("message", this.handleMessageEvent);
  }
  stop(): void {
    window.removeEventListener("message", this.handleMessageEvent);
  }
}

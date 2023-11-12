import {
  Request,
  AbstractActor,
  ActorId,
  LoadedMessage,
  ResponseMessage,
  AbstractRemoteActor,
  IActorLogic,
  IRemoteActorLogic,
} from "@/lib/actor";

export interface IContextMessageSender {
  sendMessage<M, R>(message: M): Promise<R>;
}

export class ContextActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractActor<I, R, E> {
  protected broadcast(msg: LoadedMessage): void {
    this.sender.sendMessage(msg);
  }

  private handleMessage<T extends I["type"]>(
    msg: Extract<I, Request<T>>,
    _: chrome.runtime.MessageSender,
    sendResponse: (response: ResponseMessage<I, R, E>) => void
  ) {
    this.handleRequest(msg, sendResponse);
  }

  protected listen(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  constructor(
    id: ActorId,
    logic: IActorLogic<I, R, E>,
    protected readonly sender: IContextMessageSender
  ) {
    super(id, logic);
  }
}

export class ContextRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractRemoteActor<I, R, E> {
  protected sendRequest<T extends I["type"]>(
    req: Extract<I, Request<T>>
  ): void {
    this.sender.sendMessage(req);
  }

  constructor(
    logic: IRemoteActorLogic<E>,
    protected readonly sender: IContextMessageSender
  ) {
    super(logic);
  }

  listen() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }
}

import {
  Request,
  AbstractActor,
  ActorId,
  LoadedMessage,
  ResponseMessage,
  IActorLogic,
  IRemoteActorLogic,
  IRemoteActor,
  ActorMessage,
  MessageType,
} from "@/lib/actor";
import { neverError } from "@/lib/guards";

export interface IContextActorMessageSender<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> {
  sendMessage(message: ActorMessage<I, R, E>): unknown;
}

export class ContextActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> extends AbstractActor<I, R, E> {
  protected broadcast(msg: LoadedMessage): void {
    this.sender.sendMessage(msg);
  }

  private handleMessage = <T extends I["type"]>(
    msg: Extract<I, Request<T>>,
    _: chrome.runtime.MessageSender,
    sendResponse: (response: ResponseMessage<I, R, E>) => void
  ) => {
    this.handleRequest(msg, sendResponse);
  };

  protected listen(): void {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }

  constructor(
    id: ActorId,
    logic: IActorLogic<I, R, E>,
    protected readonly sender: IContextActorMessageSender<I, R, E>
  ) {
    super(id, logic);
  }

  stop(): void {
    chrome.runtime.onMessage.removeListener(this.handleMessage);
  }
}

export interface IContextRequestSender<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> {
  sendMessage<T extends I["type"]>(
    message: Extract<I, Request<T>>
  ): Promise<ResponseMessage<Extract<I, Request<T>>, R, E>>;
}

export class ContextRemoteActor<
  I extends Request<string>,
  R extends Record<I["type"], unknown>,
  E
> implements IRemoteActor<I, R>
{
  constructor(
    private readonly logic: IRemoteActorLogic<E>,
    private readonly sender: IContextRequestSender<I, R, E>
  ) {}

  async call<T extends I["type"]>(msg: Extract<I, Request<T>>): Promise<R[T]> {
    try {
      const response = await this.sender.sendMessage(msg);
      console.log("Response", response);
      switch (response.type) {
        case MessageType.Success:
          return response.result;
        case MessageType.Error:
          throw response.error;
        default:
          throw neverError(response, "Unknown response type");
      }
    } catch (e) {
      throw this.logic.castError(e);
    }
  }
}

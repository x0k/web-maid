import Mustache from "mustache";

import type { IRemoteActor, Request } from "@/lib/actor";

import { Action, ActionResults, ActionType } from "./rpc";

const handlers: {
  [K in ActionType]: (msg: Extract<Action, Request<K>>) => ActionResults[K];
} = {
  [ActionType.RenderTemplate]: ({ template, data }) =>
    Mustache.render(template, data),
  [ActionType.RunEval]: ({ expression }) => eval(expression),
  [ActionType.ValidateSchema]: () => true,
};

export class DevSandbox implements IRemoteActor<Action, ActionResults> {
  async call<T extends ActionType>(
    msg: Extract<Action, Request<T>>
  ): Promise<ActionResults[T]> {
    return handlers[msg.type](msg as never);
  }
}

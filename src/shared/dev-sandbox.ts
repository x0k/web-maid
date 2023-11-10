import Mustache from "mustache";

import { IRemoteActor } from "@/lib/actor";

import { Action, ActionResults, ActionType } from "./rpc";

export class DevSandbox implements IRemoteActor<Action, ActionResults> {
  async call<T extends ActionType>(msg: Action): Promise<ActionResults[T]> {
    switch (msg.type) {
      case ActionType.RenderTemplate:
        return Mustache.render(msg.template, msg.data);
      case ActionType.RunEval:
        return eval(msg.expression);
    }
  }
}

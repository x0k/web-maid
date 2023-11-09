import Handlebars from "handlebars";

import { AbstractSandboxActor } from "@/lib/actor";
import { stringifyError } from "@/lib/error";
import { neverError } from "@/lib/guards";

import { Action, ActionResults, ActionType } from "@/shared/rpc";

export class SandboxActor extends AbstractSandboxActor<
  Action,
  ActionResults,
  string
> {
  async handle(msg: Action): Promise<unknown> {
    switch (msg.type) {
      case ActionType.RenderTemplate:
        return Handlebars.compile(msg.template)(msg.data);
      case ActionType.RunEval:
        return eval(msg.expression);
      default:
        throw neverError(msg, "Unknown action type");
    }
  }
  toError(error: unknown): string {
    return stringifyError(error);
  }
}

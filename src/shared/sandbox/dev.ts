import Mustache from "mustache";
import { Validator } from "@cfworker/json-schema";

import type { IRemoteActor, Request } from "@/lib/actor";
import { identity } from "@/lib/function";

import { Action, ActionResults, ActionType } from "./action";

Mustache.escape = identity;

const handlers: {
  [K in ActionType]: (msg: Extract<Action, Request<K>>) => ActionResults[K];
} = {
  [ActionType.RenderTemplate]: ({ template, data }) =>
    Mustache.render(template, data),
  [ActionType.RunEval]: ({ expression }) => eval(expression),
  [ActionType.Validate]: ({ schema, data }) =>
    new Validator(schema).validate(data).valid,
  [ActionType.ValidateSchema]: () => true,
  [ActionType.ValidateFormData]: () => ({ errors: [], errorSchema: {} }),
};

export class DevSandbox<T>
  implements IRemoteActor<Action<T>, ActionResults<T>>
{
  async call<A extends ActionType>(
    msg: Extract<Action<T>, Request<A>>
  ): Promise<ActionResults<T>[A]> {
    return handlers[msg.type](msg as never);
  }
}

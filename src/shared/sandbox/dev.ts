import Mustache from "mustache";
import { Validator } from "@cfworker/json-schema";

import type { IRemoteActor, Request, RequestMessage } from "@/lib/actor";
import { identity } from "@/lib/function/function";

import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "./action";

Mustache.escape = identity;

const handlers: {
  [K in SandboxActionType]: (
    msg: Extract<SandboxAction, Request<K>>
  ) => SandboxActionResults[K];
} = {
  [SandboxActionType.RenderTemplate]: ({ template, data }) =>
    Mustache.render(template, data),
  [SandboxActionType.RunEval]: () => {
    throw new Error("Eval is not supported in dev sandbox");
  },
  [SandboxActionType.Validate]: ({ schema, data }) =>
    new Validator(schema).validate(data).valid,
  [SandboxActionType.ValidateSchema]: () => true,
  [SandboxActionType.ValidateFormData]: () => ({ errors: [], errorSchema: {} }),
};

export class DevSandbox<T>
  implements IRemoteActor<SandboxAction<T>, SandboxActionResults<T>>
{
  async call<A extends SandboxActionType>({
    request,
  }: RequestMessage<Extract<SandboxAction<T>, Request<A>>>): Promise<
    SandboxActionResults<T>[A]
  > {
    return handlers[request.type](request as never);
  }
  start(): void {
    console.log("Starting dev sandbox");
  }
  stop(): void {
    console.log("Stopping dev sandbox");
  }
}

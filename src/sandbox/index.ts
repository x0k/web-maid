import Handlebars from "handlebars";

import { GenSandboxActor } from "@/lib/actor";
import { stringifyError } from "@/lib/error";

import { Action, ActionResults, ActionType } from "@/shared/rpc";

const actor = new GenSandboxActor<Action, ActionResults, string>(
  window,
  {
    [ActionType.RenderTemplate]: ({ template, data }) =>
      Handlebars.compile(template)(data),
    [ActionType.RunEval]: ({ expression }) => eval(expression),
  },
  stringifyError
);

actor.loaded();

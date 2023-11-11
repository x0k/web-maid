import Handlebars from "handlebars";
import Ajv from "ajv";

import { GenSandboxActor } from "@/lib/actor";
import { stringifyError } from "@/lib/error";

import { Action, ActionResults, ActionType } from "@/shared/rpc";

const ajv = new Ajv();

const actor = new GenSandboxActor<Action, ActionResults, string>(
  window,
  {
    [ActionType.RenderTemplate]: ({ template, data }) =>
      Handlebars.compile(template)(data),
    [ActionType.RunEval]: ({ expression }) => eval(expression),
    // https://ajv.js.org/api.html#ajv-validateschema-schema-object-boolean 
    [ActionType.ValidateSchema]: ({ schema }) =>
      ajv.validateSchema(schema) as boolean,
  },
  stringifyError
);

actor.loaded();

import Handlebars from "handlebars";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import { GenSandboxActor } from "@/lib/actor";
import { stringifyError } from "@/lib/error";

import { Action, ActionResults, ActionType } from "@/shared/rpc";

const ajv = new Ajv();

Handlebars.registerHelper("json", (data) => JSON.stringify(data, null, 2));
Handlebars.registerHelper("quote", (data) =>
  typeof data === "string" ? `> ${data.split("\n").join("\n> ")}` : data
);

const actor = new GenSandboxActor<Action, ActionResults, string>(
  window,
  {
    [ActionType.RenderTemplate]: ({ template, data }) =>
      Handlebars.compile(template, {
        noEscape: true,
      })(data),
    [ActionType.RunEval]: ({ expression }) => eval(expression),
    // https://ajv.js.org/api.html#ajv-validateschema-schema-object-boolean
    [ActionType.ValidateSchema]: ({ schema }) =>
      ajv.validateSchema(schema) as boolean,
    [ActionType.ValidateFormData]: ({ formData, schema, uiSchema }) =>
      validator.validateFormData(
        formData,
        schema,
        undefined,
        undefined,
        uiSchema
      ),
  },
  stringifyError
);

actor.loaded();

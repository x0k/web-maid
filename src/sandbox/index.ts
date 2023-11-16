import Handlebars from "handlebars";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import { SandboxActor } from "@/lib/actors/sandbox";
import { stringifyError } from "@/lib/error";

import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "@/lib/sandbox/action";
import { makeActorLogic } from "@/lib/actor";

const ajv = new Ajv();

Handlebars.registerHelper("json", (data) => JSON.stringify(data, null, 2));
Handlebars.registerHelper("quote", (data) =>
  typeof data === "string" ? `> ${data.split("\n").join("\n> ")}` : data
);

const frameId = new URL(window.location.href).searchParams.get("id");

if (frameId) {
  const sandbox = new SandboxActor<SandboxAction, SandboxActionResults, string>(
    frameId,
    makeActorLogic(
      {
        [SandboxActionType.RenderTemplate]: ({ template, data }) =>
          Handlebars.compile(template, {
            noEscape: true,
          })(data),
        [SandboxActionType.RunEval]: ({ expression }) => eval(expression),
        // https://ajv.js.org/api.html#ajv-validateschema-schema-object-boolean
        [SandboxActionType.ValidateSchema]: ({ schema }) =>
          ajv.validateSchema(schema) as boolean,
        [SandboxActionType.Validate]: ({ schema, data }) =>
          ajv.validate(schema, data),
        [SandboxActionType.ValidateFormData]: ({
          formData,
          schema,
          uiSchema,
        }) =>
          validator.validateFormData(
            formData,
            schema,
            undefined,
            undefined,
            uiSchema
          ),
      },
      stringifyError
    )
  );
  sandbox.start();
} else {
  console.error("No frame element found");
}

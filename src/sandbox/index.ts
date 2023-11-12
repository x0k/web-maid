import Handlebars from "handlebars";
import validator from "@rjsf/validator-ajv8";
import Ajv from "ajv";

import { GenSandboxActor } from "@/lib/actors/sandbox";
import { stringifyError } from "@/lib/error";

import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "@/shared/sandbox/action";

const ajv = new Ajv();

Handlebars.registerHelper("json", (data) => JSON.stringify(data, null, 2));
Handlebars.registerHelper("quote", (data) =>
  typeof data === "string" ? `> ${data.split("\n").join("\n> ")}` : data
);

const frameId = window.frameElement?.id;

if (frameId) {
  const sandbox = new GenSandboxActor<
    SandboxAction,
    SandboxActionResults,
    string
  >(
    frameId,
    window,
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
      [SandboxActionType.ValidateFormData]: ({ formData, schema, uiSchema }) =>
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
  sandbox.start();
} else {
  console.error("No frame element found");
}

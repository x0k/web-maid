import MuiForm from "@rjsf/mui";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

const schema: RJSFSchema = {
  title: "Test form",
  type: "string",
};

export function Form() {
  return <MuiForm schema={schema} validator={validator} />;
}

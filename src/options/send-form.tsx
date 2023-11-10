import { Button } from "@mui/material";
import validator from "@rjsf/validator-ajv8";
import MuiForm from "@rjsf/mui";

import { EvalResult } from "@/shared/extension";

export interface SendFormProps {
  result: EvalResult;
}

export function SendForm({
  result: { endpoint, schema = {}, uiSchema, value },
}: SendFormProps) {
  return (
    <MuiForm
      schema={schema}
      uiSchema={uiSchema}
      formData={value}
      validator={validator}
      onSubmit={(data) => console.log(endpoint, data)}
    >
      <Button type="submit" variant="contained" color="success" fullWidth>
        Send
      </Button>
    </MuiForm>
  );
}

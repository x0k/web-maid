import { Box, Button, Typography } from "@mui/material";
import validator from "@rjsf/validator-ajv8";
import MuiForm from "@rjsf/mui";
import { SWRMutationResponse } from "swr/mutation";

import { EvalResult, Tab } from "@/shared/extension";
import { ErrorAlert } from "@/components/error-alert";

function ConfigForm({ value, endpoint, schema = {}, uiSchema }: EvalResult) {
  return (
    <>
      <Typography>Endpoint: {endpoint}</Typography>
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
    </>
  );
}

export interface SendFormProps {
  result: SWRMutationResponse<EvalResult, unknown, Tab | null, string>;
}

export function SendForm({ result }: SendFormProps) {
  return (
    <Box display="flex" flexDirection="column" gap={1} overflow={"auto"}>
      {result.error ? (
        <ErrorAlert error={result.error} />
      ) : result.isMutating ? (
        <Typography>Loading...</Typography>
      ) : !result.data ? (
        <Typography>Choose the tab and click on "Test" button</Typography>
      ) : (
        <ConfigForm {...result.data} />
      )}
    </Box>
  );
}

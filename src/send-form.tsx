import { Alert, AlertTitle, Button, Typography } from "@mui/material";
import validator from "@rjsf/validator-ajv8";
import MuiForm from "@rjsf/mui";
import { parse } from "yaml";
import { fromZodError } from "zod-validation-error";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { Json } from "@/lib/zod";

import { configSchema } from "./config";
import { makeAppOperatorResolver } from "./operator";
import { Op, OpOrVal, evalOnContext } from "./lib/operator";

interface ConfigFormProps {
  value: Exclude<OpOrVal, Op>;
  endpoint: string;
  schema?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
}

function ConfigForm({
  value,
  endpoint,
  schema = {},
  uiSchema,
}: ConfigFormProps) {
  return (
    <>
      <Typography variant="h6">Endpoint: {endpoint}</Typography>
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
  config: string;
}

export function SendForm({ config }: SendFormProps) {
  if (config.trim() === "") {
    return (
      <Alert severity="info">
        <AlertTitle>Info</AlertTitle>
        No config
      </Alert>
    );
  }
  let configData: Json;
  try {
    configData = parse(config);
  } catch (e) {
    return (
      <Alert severity="error">
        <AlertTitle>Parsing error</AlertTitle>
        {String(e)}
      </Alert>
    );
  }
  const parseResult = configSchema.safeParse(configData);
  if (!parseResult.success) {
    const err = fromZodError(parseResult.error)
    return (
      <Alert severity="error">
        <AlertTitle>Validation error</AlertTitle>
        {err.message}
      </Alert>
    );
  }
  const { data, uiSchema, schema, context, endpoint } = parseResult.data;
  const resolver = makeAppOperatorResolver();
  let value: Exclude<OpOrVal, Op>;
  try {
    let result = traverseJsonLike(resolver, data);
    if (typeof result === "function") {
      result = result(context);
    } else {
      result = evalOnContext(result, context);
    }
    if (typeof result === "function") {
      throw new Error("Extraction produces a function, expected data");
    }
    value = result;
  } catch (e) {
    return (
      <Alert severity="error">
        <AlertTitle>Evaluation error</AlertTitle>
        {e instanceof Error ? e.message : String(e)}
      </Alert>
    );
  }
  return (
    <ConfigForm
      endpoint={endpoint}
      value={value}
      schema={schema}
      uiSchema={uiSchema}
    />
  );
}

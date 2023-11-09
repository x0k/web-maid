import { Alert, AlertTitle, Button, Typography } from "@mui/material";
import validator from "@rjsf/validator-ajv8";
import MuiForm from "@rjsf/mui";
import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";

import { makeAppOperatorResolver } from "@/shared/operator";

import { configSchema } from "./config";
import useSWR from "swr";

interface ConfigFormProps {
  value: unknown;
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

async function evalOperator(config: string) {
  if (config.trim() === "") {
    throw new Error("No config");
  }
  const configData = parse(config);
  const parseResult = configSchema.safeParse(configData);
  if (!parseResult.success) {
    throw new Error("Invalid config");
  }
  const { data, uiSchema, schema, context, endpoint } = parseResult.data;
  const resolver = makeAppOperatorResolver(window, document);
  const value = await evalInScope(traverseJsonLike(resolver, data), context);
  if (typeof value === "function") {
    throw new Error("Extraction produces a function, expected data");
  }
  return {
    endpoint,
    value,
    schema,
    uiSchema,
  };
}

export function SendForm({ config }: SendFormProps) {
  const { data, error, isLoading } = useSWR(config, evalOperator);

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error instanceof Error ? error.message : String(error)}
      </Alert>
    );
  }
  if (isLoading || !data) {
    return <Typography variant="h6">Loading...</Typography>;
  }
  return <ConfigForm {...data} />;
}

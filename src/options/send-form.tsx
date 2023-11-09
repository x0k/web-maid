import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
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

async function evalOperator([config, doc]: [string, string]) {
  if (config.trim() === "") {
    throw new Error("No config");
  }
  if (doc.trim() === "") {
    throw new Error("No document");
  }
  const configData = parse(config);
  const parseResult = configSchema.safeParse(configData);
  if (!parseResult.success) {
    throw new Error("Invalid config");
  }
  const { data, uiSchema, schema, context, endpoint } = parseResult.data;
  const tmpDoc = document.implementation.createHTMLDocument('Scraper test document');
  const base = document.createElement("base");
  base.href = document.location.origin;
  tmpDoc.head.appendChild(base);
  tmpDoc.body.innerHTML = doc;
  const resolver = makeAppOperatorResolver(window, tmpDoc);
  const value = await evalInScope(traverseJsonLike(resolver, data), {
    functions: {},
    constants: {},
    context,
  });
  return {
    endpoint,
    value,
    schema,
    uiSchema,
  };
}

export interface SendFormProps {
  config: string;
  doc: string;
}

export function SendForm({ config, doc }: SendFormProps) {
  const { data, error, isLoading } = useSWR([config, doc], evalOperator);
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {error ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error instanceof Error ? error.message : String(error)}
        </Alert>
      ) : isLoading || !data ? (
        <Typography variant="h6">Loading...</Typography>
      ) : (
        <ConfigForm {...data} />
      )}
    </Box>
  );
}

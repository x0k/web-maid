import { useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import MuiForm from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { parse } from "yaml";

import { stringifyError } from "@/lib/error";
import { Editor } from "@/components/editor";
import { monaco } from "@/lib/monaco";
import { Json } from "@/lib/zod";
import { ErrorAlert } from "@/components/error-alert";
import { Row } from "@/components/row";

import {
  loadLocalSettings,
  loadSyncSettings,
  saveLocalSettings,
  saveSyncSettings,
} from "@/shared/extension";

const secretsSchemaModel = monaco.editor.createModel("", "yaml");

function showError(err: unknown) {
  enqueueSnackbar({
    variant: "error",
    message: stringifyError(err),
  });
}

async function saveSecrets(_: string, { arg }: { arg: Json }) {
  await saveLocalSettings({ secrets: arg });
}

async function saveSecretsSchema(_: string, { arg }: { arg: string }) {
  await saveSyncSettings({ secretsSchema: arg });
}

export function Secrets() {
  const local = useSWR("settings/local", loadLocalSettings, {
    revalidateOnFocus: false,
  });
  const secretsMutation = useSWRMutation("settings/local", saveSecrets, {
    onError: showError,
  });
  const sync = useSWR("settings/sync/secrets-schema", loadSyncSettings, {
    onSuccess({ secretsSchema }) {
      secretsSchemaModel.setValue(secretsSchema);
    },
  });
  const secretsSchemaMutation = useSWRMutation(
    "settings/sync/secrets-schema",
    saveSecretsSchema,
    {
      onError: showError,
    }
  );
  const secretsSchema = useMemo(() => {
    const schema = sync.data?.secretsSchema;
    return schema ? parse(schema) : {};
  }, [sync.data?.secretsSchema]);
  return (
    <Box
      flexGrow={1}
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gridTemplateRows="auto 1fr"
      overflow={"hidden"}
      gap={2}
    >
      <Row>
        <Typography flexGrow={1}>Secrets schema</Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() =>
            secretsSchemaMutation.trigger(secretsSchemaModel.getValue())
          }
        >
          Update
        </Button>
      </Row>
      <Row>
        <Typography>Secrets values</Typography>
      </Row>
      <Editor model={secretsSchemaModel} />

      {local.error ? (
        <ErrorAlert error={local.error} />
      ) : (
        <MuiForm
          schema={secretsSchema}
          validator={validator}
          formData={local.data}
          omitExtraData
          onSubmit={({ formData }) => {
            secretsMutation.trigger(formData);
          }}
        >
          <Button type="submit" variant="contained" color="success" fullWidth>
            Save
          </Button>
        </MuiForm>
      )}
    </Box>
  );
}

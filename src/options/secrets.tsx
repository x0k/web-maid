import { useEffect, useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { parse } from "yaml";

import { stringifyError } from "@/lib/error";
import { Editor } from "@/components/editor";
import { monaco } from "@/lib/monaco";
import { Json } from "@/lib/zod";
import { ErrorAlert } from "@/components/error-alert";
import { Row } from "@/components/row";
import { Form } from "@/components/form";

import {
  loadLocalSettings,
  loadSyncSettings,
  saveLocalSettings,
  saveSyncSettings,
} from "@/shared/extension";
import { useSandbox } from "@/shared/react";
import { FormDataValidator } from "@/shared/form-data-validator";

const secretsSchemaModel = monaco.editor.createModel("", "yaml");

function showError(err: unknown) {
  enqueueSnackbar({
    variant: "error",
    message: stringifyError(err),
  });
}

function showSuccess(message: string) {
  enqueueSnackbar({
    variant: "success",
    message,
  });
}

async function saveSecrets(_: string, { arg }: { arg: Json }) {
  await saveLocalSettings({ secrets: arg });
  return arg;
}

async function saveSecretsSchema(_: string, { arg }: { arg: string }) {
  await saveSyncSettings({ secretsSchema: arg });
  return arg;
}

export function Secrets() {
  const sandbox = useSandbox();
  const asyncValidator = useMemo(
    () => new FormDataValidator(sandbox),
    [sandbox]
  );
  const local = useSWR("settings/local", loadLocalSettings, {
    revalidateOnFocus: false,
  });
  const secretsMutation = useSWRMutation(
    "settings/local/secrets",
    saveSecrets,
    {
      onSuccess: (secrets) => {
        local.mutate({ secrets });
        showSuccess("Secrets saved");
      },
      onError: showError,
    }
  );
  const sync = useSWR("settings/sync", loadSyncSettings, {
    revalidateOnFocus: false,
  });
  useEffect(() => {
    secretsSchemaModel.setValue(sync.data?.secretsSchema || "");
  }, [sync.data?.secretsSchema]);
  const secretsSchemaMutation = useSWRMutation(
    "settings/sync/secrets-schema",
    saveSecretsSchema,
    {
      onSuccess: (secretsSchema) => {
        sync.mutate({ config: "", ...sync.data, secretsSchema });
        showSuccess("Secrets schema saved");
      },
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
        <Form
          id="secrets"
          schema={secretsSchema}
          formData={local.data?.secrets}
          omitExtraData
          asyncValidator={asyncValidator}
          onSubmit={({ formData }) => {
            secretsMutation.trigger(formData);
          }}
        >
          <Button type="submit" variant="contained" color="success" fullWidth>
            Save
          </Button>
        </Form>
      )}
    </Box>
  );
}

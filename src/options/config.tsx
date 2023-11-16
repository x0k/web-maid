import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";

import { monaco } from "@/lib/monaco";
import { stringifyError } from "@/lib/error";
import { useMonacoLogger } from "@/lib/react-monaco-logger";
import { useFormDataValidator, useSandbox } from "@/shared/sandbox/react";
import { createOperatorResolver } from "@/shared/config/create";
import { Editor } from "@/components/editor";
import { ErrorAlert } from "@/components/error-alert";
import { Row } from "@/components/row";

import {
  Tab,
  getAllTabs,
  loadSyncSettings,
  saveSyncSettings,
  makeIsomorphicConfigEval,
  checkForTabsPermission,
  requestForTabsPermission,
  loadLocalSettings,
  saveLocalSettings,
} from "@/shared/core";
import {
  useContextActor,
  useExtensionActorLogic,
  useFormShower,
  useRootFactory,
} from "@/shared/react";
import { Fetcher } from "@/shared/fetcher";
import {
  RemoteEvaluator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/remote-impl";

import { contextId, sandboxIFrameId } from "./constants";
import { TabsSelector } from "./tabs-selector";
import { Readme } from "./readme";

const configModel = monaco.editor.createModel("", "yaml");
const secretsModel = monaco.editor.createModel("", "yaml");
const logsModel = monaco.editor.createModel("", "yaml");

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

async function saveConfig(_: string, { arg }: { arg: string }) {
  await saveSyncSettings({ config: arg });
}

async function saveSecrets(_: string, { arg }: { arg: string }) {
  await saveLocalSettings({ secrets: arg });
}

const initialTabs: Tab[] = [];

const fetcher = new Fetcher();

export function Config() {
  const sandbox = useSandbox();
  const logsEditorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
  const logger = useMonacoLogger(logsEditorRef);
  const rootRef = useRef<HTMLDivElement>(null);
  const rootFactory = useRootFactory(rootRef);
  const formDataValidator = useFormDataValidator(sandboxIFrameId, sandbox);
  const formShower = useFormShower(rootFactory, formDataValidator);
  const evalConfig = useMemo(
    () =>
      makeIsomorphicConfigEval({
        Create(debug) {
          return createOperatorResolver({
            debug,
            evaluator: new RemoteEvaluator(sandboxIFrameId, sandbox),
            rendered: new RemoteRenderer(sandboxIFrameId, sandbox),
            validator: new RemoteValidator(sandboxIFrameId, sandbox),
            fetcher,
            logger,
            formShower,
          });
        },
      }),
    [sandbox, logger, formShower]
  );
  const [debug, setDebug] = useState(true);
  const [selectedTab, selectTab] = useState<Tab | null>(null);
  const evalRunner = useSWRMutation(
    [debug, selectedTab],
    (
      [debug, tab],
      { arg: { config, secrets } }: { arg: { config: string; secrets: string } }
    ) => evalConfig(contextId, debug, config, secrets, tab?.id),
    {
      onSuccess(result) {
        logger.log({ success: result });
      },
      onError(error) {
        logger.log({ error });
      },
    }
  );

  const logic = useExtensionActorLogic(formShower, logger, fetcher);
  const actor = useContextActor(contextId, logic);
  useEffect(() => {
    actor.start();
    return () => {
      actor.stop();
    };
  }, [actor]);

  const tabsPermission = useSWR("tabs/permission", checkForTabsPermission, {
    revalidateOnFocus: false,
  });
  const requestForTabsPermissionMutation = useSWRMutation(
    "tabs/permission",
    () => requestForTabsPermission(),
    {
      onSuccess: (result) => {
        tabsPermission.mutate(result);
      },
      onError: showError,
    }
  );
  const tabs = useSWR(() => (tabsPermission.data ? "tabs" : null), getAllTabs, {
    fallbackData: initialTabs,
  });

  const [isSecretsEditor, setIsSecretsEditor] = useState(false);
  useSWR("settings/sync", loadSyncSettings, {
    revalidateOnFocus: false,
    onSuccess({ config }) {
      configModel.setValue(config);
    },
    onError: showError,
  });
  const configMutation = useSWRMutation("settings/sync/config", saveConfig, {
    onSuccess() {
      showSuccess("Config saved");
    },
    onError: showError,
  });
  useSWR("settings/local", loadLocalSettings, {
    revalidateOnFocus: false,
    onSuccess({ secrets }) {
      secretsModel.setValue(secrets);
    },
    onError: showError,
  });
  const secretsMutation = useSWRMutation(
    "settings/local/secrets",
    saveSecrets,
    {
      onSuccess() {
        showSuccess("Secrets saved");
      },
      onError: showError,
    }
  );
  return (
    <Box
      flexGrow={1}
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gridTemplateRows="auto 1fr"
      overflow={"hidden"}
      gap={2}
    >
      <Box gridRow="1 / 3" display="flex" flexDirection="column" gap={2}>
        {isSecretsEditor ? (
          <>
            <Row>
              <Typography flexGrow={1} variant="h6">
                Secrets
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  secretsMutation.trigger(secretsModel.getValue());
                }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => {
                  setIsSecretsEditor(false);
                }}
              >
                Edit config
              </Button>
            </Row>
            <Editor model={secretsModel} />
          </>
        ) : (
          <>
            <Row>
              <Typography flexGrow={1} variant="h6">
                Config
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  configMutation.trigger(configModel.getValue());
                }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => {
                  setIsSecretsEditor(true);
                }}
              >
                Edit secrets
              </Button>
            </Row>
            <Editor model={configModel} />
          </>
        )}
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" flexDirection="row" gap={2} alignItems="center">
          <Typography flexGrow={1} variant="h6">
            Execution
          </Typography>
          <FormControlLabel
            style={{ margin: 0, gap: 4 }}
            control={<Checkbox style={{ padding: 4 }} />}
            label="Debug"
            checked={debug}
            onChange={(_, v) => setDebug(v)}
          />
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => {
              evalRunner.trigger({
                config: configModel.getValue(),
                secrets: secretsModel.getValue(),
              });
            }}
            disabled={evalRunner.isMutating}
          >
            Test
          </Button>
          {Boolean(evalRunner.data !== undefined || evalRunner.error) && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => {
                evalRunner.reset();
                logsModel.setValue("");
              }}
            >
              Reset
            </Button>
          )}
        </Box>
        {tabsPermission.data !== true ? (
          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={
              tabsPermission.isLoading ||
              requestForTabsPermissionMutation.isMutating
            }
            onClick={() => requestForTabsPermissionMutation.trigger()}
          >
            Grant permissions to execute on opened tabs
          </Button>
        ) : tabs.error ? (
          <ErrorAlert error={tabs.error} />
        ) : (
          <TabsSelector
            tabs={tabs.data}
            selectedTab={selectedTab}
            onSelect={selectTab}
          />
        )}
      </Box>
      <Box display="flex" flexDirection="column" gap={2} overflow="auto">
        {evalRunner.isMutating && (
          <LinearProgress style={{ marginBottom: 16 }} />
        )}
        <div ref={rootRef} />
        {evalRunner.error && <ErrorAlert error={evalRunner.error} />}
        {evalRunner.isMutating ||
        evalRunner.data !== undefined ||
        evalRunner.error ? (
          <Box height="100%" display="flex" flexDirection="column">
            <Editor ref={logsEditorRef} model={logsModel} />
          </Box>
        ) : (
          <Readme />
        )}
      </Box>
    </Box>
  );
}

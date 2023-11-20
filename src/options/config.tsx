import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { Editor } from "@/components/editor";
import { ErrorAlert } from "@/components/error-alert";
import { Row } from "@/components/row";

import { useFormDataValidator, useSandbox } from "@/shared/sandbox/react-hooks";
import { createOperatorResolver } from "@/shared/config/create";
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
import { useContextActor, useExtensionActorLogic } from "@/shared/react-hooks";
import { Fetcher } from "@/shared/fetcher";
import {
  RemoteEvaluator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";
import { useRootFactory } from "@/shared/react-root-factory";
import { useFormShower } from "@/shared/react-form-shower";
import { useOkShower } from "@/shared/react-ok-shower";
import { Docs } from "@/shared/config/docs";
import { EditorFile, FilesEditor } from "@/components/files-editor";

import { contextId, sandboxIFrameId } from "./constants";
import { TabsSelector } from "./tabs-selector";

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
  const [rootFactoryRef, children, clearRoot] = useRootFactory();
  const formDataValidator = useFormDataValidator(sandboxIFrameId, sandbox);
  const formShower = useFormShower(rootFactoryRef.current, formDataValidator);
  const okShower = useOkShower(rootFactoryRef.current);
  const evalConfig = useMemo(
    () =>
      makeIsomorphicConfigEval((debug) =>
        createOperatorResolver({
          debug,
          evaluator: new RemoteEvaluator(sandboxIFrameId, sandbox),
          rendered: new RemoteRenderer(sandboxIFrameId, sandbox),
          validator: new RemoteValidator(sandboxIFrameId, sandbox),
          fetcher,
          logger,
          formShower,
          okShower,
        })
      ),
    [sandbox, logger, formShower, okShower]
  );
  const [debug, setDebug] = useState(true);
  const [selectedTab, selectTab] = useState<Tab | null>(null);
  const evalRunner = useSWRMutation(
    [debug, selectedTab],
    (
      [debug, tab],
      { arg: { config, secrets } }: { arg: { config: string; secrets: string } }
    ) => evalConfig(debug, config, secrets, contextId, tab?.id),
    {
      onSuccess(result) {
        logger.log({ success: result });
      },
      onError(error) {
        logger.log({ error });
      },
    }
  );

  const logic = useExtensionActorLogic(formShower, okShower, logger, fetcher);
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
  const [files, setFiles] = useState<EditorFile[]>([]);
  return (
    <div className="grow grid grid-cols-2 grid-rows-[auto_1fr] gap-4 overflow-hidden">
      <div className="row-start-1 row-end-3 flex flex-col gap-4">
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
            <FilesEditor
              files={files}
              onCreateFile={() =>
                setFiles((fs) =>
                  fs.concat({
                    id: Date.now().toString(16),
                    name: `file-${fs.length + 1}`,
                    content: "",
                  })
                )
              }
              onSaveFiles={(files) => setFiles(files)}
              onRemoveFile={(id) =>
                setFiles((fs) => fs.filter((f) => f.id !== id))
              }
            />
          </>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4 items-center">
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
                clearRoot();
              }}
            >
              Reset
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            color="info"
            target="_blank"
            href={chrome.runtime.getURL("docs.html")}
          >
            Docs
          </Button>
        </div>
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
      </div>
      <div className="flex flex-col gap-4 overflow-auto">
        {evalRunner.isMutating && (
          <LinearProgress style={{ marginBottom: 16 }} />
        )}
        {children}
        {evalRunner.error && <ErrorAlert error={evalRunner.error} />}
        {evalRunner.isMutating ||
        evalRunner.data !== undefined ||
        evalRunner.error ? (
          <div className="h-full flex flex-col">
            <Editor ref={logsEditorRef} model={logsModel} />
          </div>
        ) : (
          <Docs />
        )}
      </div>
    </div>
  );
}

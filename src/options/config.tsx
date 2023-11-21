import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { monaco } from "@/lib/monaco";
import { stringifyError } from "@/lib/error";
import { useMonacoLogger } from "@/lib/react-monaco-logger";
import { Editor } from "@/components/editor";
import { ErrorAlert } from "@/components/error-alert";
import { Row } from "@/components/row";
import { EditorFile, FilesEditor } from "@/components/files-editor";

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

import { contextId, sandboxIFrameId } from "./constants";
import { TabsSelector } from "./tabs-selector";

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

  const logic = useExtensionActorLogic(formShower, okShower, logger, fetcher);
  const actor = useContextActor(contextId, logic);
  useEffect(() => {
    actor.start();
    return () => {
      actor.stop();
    };
  }, [actor]);

  const queryClient = useQueryClient();
  const tabsPermission = useQuery({
    queryKey: ["tabs", "permission"],
    queryFn: checkForTabsPermission,
  });
  const requestForTabsPermissionMutation = useMutation({
    mutationFn: requestForTabsPermission,
    onSuccess: (result) => {
      queryClient.setQueryData(["tabs", "permission"], result);
    },
    onError: showError,
  });
  const tabs = useQuery({
    queryKey: ["tabs"],
    queryFn: getAllTabs,
    initialData: initialTabs,
    enabled: tabsPermission.data,
  });

  const [isSecretsEditor, setIsSecretsEditor] = useState(false);
  const {
    data: { configFiles },
  } = useQuery({
    queryKey: ["settings", "sync"],
    queryFn: loadSyncSettings,
    initialData: { configFiles: [] },
  });
  const saveConfigFilesMutation = useMutation({
    mutationFn: (configFiles: EditorFile[]) =>
      saveSyncSettings({ configFiles }),
    onSuccess: () => {
      showSuccess("Config files saved");
    },
    onError: showError,
  });
  const evalMutation = useMutation({
    mutationFn: ({ config, secrets }: { config: string; secrets: string }) =>
      evalConfig(debug, config, secrets, contextId, selectedTab?.id),
    onSuccess: (success) => {
      logger.log({ success });
    },
    onError: (error) => {
      logger.log({ error });
    },
  });

  const {
    data: { secrets },
  } = useQuery({
    queryKey: ["settings", "local"],
    queryFn: loadLocalSettings,
    initialData: {
      secrets: "",
    },
  });
  useEffect(() => {
    secretsModel.setValue(secrets);
  }, [secrets]);
  const secretsMutation = useMutation({
    mutationFn: (secrets: string) => saveLocalSettings({ secrets }),
    onSuccess: () => {
      showSuccess("Secrets saved");
    },
    onError: showError,
  });
  return (
    <div className="grow grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_1fr] gap-4 overflow-hidden">
      <div className="row-start-1 lg:row-end-3 flex flex-col gap-4 min-h-[45vh]">
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
                  secretsMutation.mutate(secretsModel.getValue());
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
              files={configFiles}
              onCreateFile={() => {
                showError("Not implemented");
              }}
              onSaveFiles={saveConfigFilesMutation.mutate}
              onRemoveFile={(id) => showError(`Not implemented: ${id}`)}
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
              const main = configFiles.find((f) => f.id === "main");
              if (!main) {
                showError("Main file not found");
                return;
              }
              evalMutation.mutate({
                config: main.content,
                secrets: secretsModel.getValue(),
              });
            }}
            disabled={evalMutation.isPending}
          >
            Test
          </Button>
          {Boolean(evalMutation.isSuccess || evalMutation.isError) && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => {
                evalMutation.reset();
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
              requestForTabsPermissionMutation.isPending
            }
            onClick={() => requestForTabsPermissionMutation.mutate()}
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
        {evalMutation.isPending && (
          <LinearProgress style={{ marginBottom: 16 }} />
        )}
        {children}
        {evalMutation.isError && <ErrorAlert error={evalMutation.error} />}
        {evalMutation.isPending ||
        evalMutation.isSuccess ||
        evalMutation.isError ? (
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

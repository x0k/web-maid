import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { monaco } from "@/lib/monaco";
import { stringifyError } from "@/lib/error";
import { useMonacoLogger } from "@/lib/react-monaco-logger";

import { Editor } from "@/components/editor";
import { Row } from "@/components/row";
import {
  EditorFile,
  FilesEditor,
  FilesEditorState,
  saveAllFiles,
  someFileChanged,
} from "@/components/files-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button as RxBtn } from "@/components/ui/button";
import { ErrorAlert } from "@/components/error-alert";

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
  createConfigFile,
  deleteConfigFile,
  ConfigFile,
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
import { CreateConfigFileForm } from "./create-config-file-form";
import { SearchableDocs } from "./searchable-docs";

const secretsModel = monaco.editor.createModel("", "yaml");
const logsModel = monaco.editor.createModel("", "yaml");

const initialTabs: Tab[] = [];

const fetcher = new Fetcher();

function showError(err: unknown) {
  enqueueSnackbar({
    message: stringifyError(err),
    variant: "error",
  });
}
function showSuccess(message: string) {
  enqueueSnackbar({
    message,
    variant: "success",
  });
}

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
      queryClient.invalidateQueries({ queryKey: ["settings", "sync"] });
    },
    onError: showError,
  });
  const createConfigFileMutation = useMutation({
    mutationFn: (name: string) => createConfigFile(name, ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "sync"] });
    },
    onError: showError,
  });
  const removeConfigFileMutation = useMutation({
    mutationFn: deleteConfigFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "sync"] });
    },
    onError: showError,
  });

  const evalMutation = useMutation({
    mutationFn: ({
      configFiles,
      secrets,
    }: {
      configFiles: ConfigFile[];
      secrets: string;
    }) => evalConfig(debug, configFiles, secrets, contextId, selectedTab?.id),
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

  const filesEditorStateRef = useRef<FilesEditorState>(null);
  const showEditor =
    evalMutation.isPending || evalMutation.isSuccess || evalMutation.isError;
  const [isCreateOpen, setCreateOpen] = useState(false);
  const openCreateDialog = useCallback(() => setCreateOpen(true), []);
  const delayedEditorFocus = useCallback(
    () => setTimeout(() => filesEditorStateRef.current?.editor?.focus(), 100),
    []
  );
  const closeCreateDialog = useCallback(() => {
    setCreateOpen(false);
    delayedEditorFocus();
  }, [delayedEditorFocus]);
  const [toRemove, setToRemove] = useState<string>("");
  const closeRemoveDialog = useCallback(() => {
    setToRemove("");
    delayedEditorFocus();
  }, [delayedEditorFocus]);
  return (
    <>
      <div className="grow grid grid-cols-1 lg:grid-cols-2 grid-rows-[1fr_auto_1fr] lg:grid-rows-[auto_1fr] gap-4 overflow-hidden">
        <div className="row-start-1 lg:row-end-3 flex flex-col gap-4">
          {isSecretsEditor ? (
            <>
              <Row>
                <h3 className="grow scroll-m-20 text-2xl font-semibold tracking-tight">
                  Secrets
                </h3>
                <Button
                  key="save-secrets"
                  color="primary"
                  variant="contained"
                  size="small"
                  onClick={() => {
                    secretsMutation.mutate(secretsModel.getValue());
                  }}
                >
                  Save
                </Button>
                <Button
                  key="edit-config"
                  color="secondary"
                  variant="contained"
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
                <h3 className="grow scroll-m-20 text-2xl font-semibold tracking-tight">
                  Config
                </h3>
                <Button
                  key="edit-secrets"
                  color="secondary"
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setIsSecretsEditor(true);
                  }}
                >
                  Edit secrets
                </Button>
              </Row>
              <FilesEditor
                ref={filesEditorStateRef}
                files={configFiles}
                onCreateFile={openCreateDialog}
                onSaveFiles={saveConfigFilesMutation.mutate}
                onRemoveFile={setToRemove}
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-center">
            <h3 className="grow scroll-m-20 text-2xl font-semibold tracking-tight">
              Execution
            </h3>
            <FormControlLabel
              style={{ margin: 0, gap: 4 }}
              control={<Checkbox style={{ padding: 4 }} />}
              label="Debug"
              checked={debug}
              onChange={(_, v) => setDebug(v)}
            />
            <Button
              color="warning"
              variant="contained"
              size="small"
              onClick={() => {
                const { current: editorState } = filesEditorStateRef;
                if (editorState && someFileChanged(editorState)) {
                  enqueueSnackbar({
                    message: "You have unsaved changes",
                    variant: "warning",
                  });
                }
                // Run unsaved files
                const filesToRun = editorState
                  ? saveAllFiles(editorState)
                  : configFiles;
                evalMutation.mutate({
                  configFiles: filesToRun,
                  secrets: secretsModel.getValue(),
                });
              }}
              disabled={evalMutation.isPending}
            >
              Test
            </Button>
            {Boolean(evalMutation.isSuccess || evalMutation.isError) && (
              <Button
                color="error"
                variant="contained"
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
              color="info"
              size="small"
              variant="contained"
              target="_blank"
              href={chrome.runtime.getURL("docs.html")}
            >
              Docs
            </Button>
          </div>
          {tabsPermission.data !== true ? (
            <Button
              color="success"
              variant="contained"
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
          {evalMutation.isPending && <LinearProgress />}
          {children}
          {evalMutation.isError && <ErrorAlert error={evalMutation.error} />}
          <Editor
            className={showEditor ? "block" : "hidden"}
            ref={logsEditorRef}
            model={logsModel}
          />
          <SearchableDocs className={showEditor ? "hidden" : "block"} />
        </div>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={closeCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new file</DialogTitle>
          </DialogHeader>
          <CreateConfigFileForm
            onSubmit={async ({ name }) => {
              await createConfigFileMutation.mutateAsync(name);
              closeCreateDialog();
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={toRemove !== ""} onOpenChange={closeRemoveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove file</DialogTitle>
            <DialogDescription>
              Do you really want to remove "
              {filesEditorStateRef.current?.filesMap.get(toRemove)?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <RxBtn
              type="submit"
              onClick={async () => {
                await removeConfigFileMutation.mutateAsync(toRemove);
                closeRemoveDialog();
              }}
            >
              Remove
            </RxBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

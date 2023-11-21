import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { monaco } from "@/lib/monaco";
import { stringifyError } from "@/lib/error";
import { useMonacoLogger } from "@/lib/react-monaco-logger";
import { some } from "@/lib/iterable";

import { Editor } from "@/components/editor";
import { Row } from "@/components/row";
import {
  EditorFile,
  FilesEditor,
  FilesEditorState,
} from "@/components/files-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

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
import { ErrorAlert } from "@/components/alert-error";
import { CreateConfigFileForm } from "./create-config-file-form";

const secretsModel = monaco.editor.createModel("", "yaml");
const logsModel = monaco.editor.createModel("", "yaml");

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
  const { toast } = useToast();
  function showError(err: unknown) {
    toast({
      title: "Error",
      description: stringifyError(err),
      variant: "destructive",
    });
  }
  function showSuccess(message: string) {
    toast({
      title: "Success",
      description: message,
    });
  }

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

  const filesEditorStateRef = useRef<FilesEditorState>(null);
  const showEditor =
    evalMutation.isPending || evalMutation.isSuccess || evalMutation.isError;
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [toRemove, setToRemove] = useState<string>("");
  return (
    <>
      <div className="grow grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_1fr] gap-4 overflow-hidden">
        <div className="row-start-1 lg:row-end-3 flex flex-col gap-4 min-h-[45vh]">
          {isSecretsEditor ? (
            <>
              <Row>
                <h3 className="grow scroll-m-20 text-2xl font-semibold tracking-tight">
                  Secrets
                </h3>
                <Button
                  color="primary"
                  onClick={() => {
                    secretsMutation.mutate(secretsModel.getValue());
                  }}
                >
                  Save
                </Button>
                <Button
                  color="secondary"
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
                  color="secondary"
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
                onCreateFile={() => setCreateOpen(true)}
                onSaveFiles={saveConfigFilesMutation.mutate}
                onRemoveFile={(id) => setToRemove(id)}
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 items-center">
            <h3 className="grow scroll-m-20 text-2xl font-semibold tracking-tight">
              Execution
            </h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="debug"
                checked={debug}
                onCheckedChange={(v) => setDebug(v === true)}
              />
              <label
                htmlFor="debug"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Debug
              </label>
            </div>
            <Button
              color="warning"
              onClick={() => {
                const main = configFiles.find((f) => f.id === "main");
                if (!main) {
                  showError("Main file not found");
                  return;
                }
                const { current: editorState } = filesEditorStateRef;
                if (
                  editorState &&
                  (editorState.active?.isChanged ||
                    some((f) => f.isChanged, editorState.files.values()))
                ) {
                  toast({
                    title: "Warning",
                    description: "You have unsaved changes",
                  });
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
                color="error"
                onClick={() => {
                  evalMutation.reset();
                  logsModel.setValue("");
                  clearRoot();
                }}
              >
                Reset
              </Button>
            )}
            <Button color="info" asChild>
              <a target="_blank" href={chrome.runtime.getURL("docs.html")}>
                Docs
              </a>
            </Button>
          </div>
          {tabsPermission.data !== true ? (
            <Button
              color="success"
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
          {children}
          {evalMutation.isError && <ErrorAlert error={evalMutation.error} />}
          <div
            className={`h-full flex flex-col ${
              showEditor ? "block" : "hidden"
            }`}
          >
            <Editor ref={logsEditorRef} model={logsModel} />
          </div>
          <Docs className={showEditor ? "hidden" : "block"} />
        </div>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new file</DialogTitle>
          </DialogHeader>
          <CreateConfigFileForm
            onSubmit={async ({ name }) => {
              await createConfigFileMutation.mutateAsync(name);
              setCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={toRemove !== ""} onOpenChange={() => setToRemove("")}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove file</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "
              {filesEditorStateRef.current?.filesMap.get(toRemove)?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="submit"
              onClick={async () => {
                await removeConfigFileMutation.mutateAsync(toRemove);
                setToRemove("");
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

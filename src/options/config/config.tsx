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
import { useFormDataValidator, useSandbox } from "@/lib/sandbox/react";
import { createOperatorResolver } from "@/lib/config/create";
import { prepareForSending } from '@/lib/serialization';
import { Editor } from "@/components/editor";
import { ErrorAlert } from "@/components/error-alert";

import {
  Tab,
  getAllTabs,
  loadSyncSettings,
  saveSyncSettings,
  makeIsomorphicConfigEval,
} from "@/shared/core";
import {
  useContextActor,
  useExtensionActorLogic,
  useFormShower,
  useRootFactory,
} from "@/shared/react";
import { Evaluator, Renderer, Validator } from "@/shared/impl";

import { contextId, sandboxIFrameId } from "../constants";
import { TabsSelector } from "./tabs-selector";
import { Readme } from "./readme";

const configModel = monaco.editor.createModel("", "yaml");

const logsModel = monaco.editor.createModel("", "yaml");

function showError(err: unknown) {
  enqueueSnackbar({
    variant: "error",
    message: stringifyError(err),
  });
}

async function saveConfig(_: string, { arg }: { arg: string }) {
  await saveSyncSettings({ config: arg });
}

const initialTabs: Tab[] = [];

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
            evaluator: new Evaluator(sandboxIFrameId, sandbox),
            rendered: new Renderer(sandboxIFrameId, sandbox),
            validator: new Validator(sandboxIFrameId, sandbox),
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
    ([debug, tab], { arg: config }: { arg: string }) =>
      evalConfig(contextId, debug, config, tab?.id),
    {
      onSuccess(result) {
        logger.log({ success: result });
      },
      onError(error) {
        logger.log(prepareForSending({ error: error }));
      },
    }
  );

  const tabs = useSWR("tabs", getAllTabs, {
    fallbackData: initialTabs,
  });
  useSWR("settings/sync", loadSyncSettings, {
    revalidateOnFocus: false,
    onSuccess({ config }) {
      configModel.setValue(config);
    },
    onError: showError,
  });
  const configMutation = useSWRMutation("settings/sync", saveConfig, {
    onError: showError,
  });
  const logic = useExtensionActorLogic(formShower, logger);
  const actor = useContextActor(contextId, logic);
  useEffect(() => {
    actor.start();
    return () => {
      actor.stop();
    };
  }, [actor]);
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
        <Box display="flex" flexDirection="row" gap={2} alignItems="center">
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
        </Box>
        <Editor model={configModel} />
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
              evalRunner.trigger(configModel.getValue());
            }}
            disabled={evalRunner.isMutating}
          >
            Test
          </Button>
          {Boolean(evalRunner.data || evalRunner.error) && (
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
        {tabs.error ? (
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
        {evalRunner.isMutating || evalRunner.data || evalRunner.error ? (
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

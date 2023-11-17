import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import useSWRMutation from "swr/mutation";
import { stringify } from "yaml";
import { nanoid } from "nanoid";

import {
  IRemoteActor,
  makeActorLogic,
  makeRemoteActorLogic,
} from "@/lib/actor";
import { prepareForSerialization } from "@/lib/serialization";
import { stringifyError } from "@/lib/error";
import { noop } from "@/lib/function/function";
import { ContextActor, ContextRemoteActor } from "@/lib/actors/context";
import { ErrorAlert } from "@/components/error-alert";

import { useFormDataValidator } from "@/shared/sandbox/react-hooks";
import { SandboxAction, SandboxActionResults } from "@/shared/sandbox/action";
import { useFormShower } from "@/shared/react-form-shower";
import { createOperatorResolver } from "@/shared/config/create";
import {
  RemoteEvaluator,
  RemoteRenderer,
  RemoteValidator,
} from "@/shared/sandbox/remote-impl";
import { BACKGROUND_ACTOR_ID } from "@/shared/background/core";
import { RemoteFetcher } from "@/shared/background/remote-impl";
import { useRootFactory } from "@/shared/react-root-factory";
import {
  BackgroundAction,
  BackgroundActionResults,
} from "@/shared/background/action";
import {
  TabAction,
  TabActionResults,
  TabActionType,
} from "@/shared/tab/action";
import {
  loadLocalSettings,
  loadSyncSettings,
  makeIsomorphicConfigEval,
} from "@/shared/core";

import { sandboxIFrameId } from "./constants";

export interface PopupProps {
  sandbox: IRemoteActor<SandboxAction, SandboxActionResults>;
}

const background = new ContextRemoteActor<
  BackgroundAction,
  BackgroundActionResults,
  string
>(makeRemoteActorLogic(stringifyError), {
  sendMessage(msg: unknown) {
    return chrome.runtime.sendMessage(prepareForSerialization(msg));
  },
});

export function Popup({ sandbox }: PopupProps) {
  const [rootFactoryRef, children] = useRootFactory();
  const formDataValidator = useFormDataValidator(sandboxIFrameId, sandbox);
  const formShower = useFormShower(rootFactoryRef.current, formDataValidator);
  const evalConfig = useMemo(
    () =>
      makeIsomorphicConfigEval((debug) =>
        createOperatorResolver({
          debug,
          evaluator: new RemoteEvaluator(sandboxIFrameId, sandbox),
          rendered: new RemoteRenderer(sandboxIFrameId, sandbox),
          validator: new RemoteValidator(sandboxIFrameId, sandbox),
          formShower,
          fetcher: new RemoteFetcher(BACKGROUND_ACTOR_ID, background),
          logger: console,
        })
      ),
    [sandbox, formShower]
  );
  const [isVisible, setIsVisible] = useState(false);
  const callbackRef = useRef<NodeJS.Timeout>();
  const evaluator = useSWRMutation(
    "config",
    async (_, { arg: debug }: { arg: boolean }) => {
      clearTimeout(callbackRef.current);
      setIsVisible(true);
      const [local, sync] = await Promise.all([
        loadLocalSettings(),
        loadSyncSettings(),
      ] as const);
      return evalConfig(debug, sync.config, local.secrets);
    },
    {
      onSuccess() {
        callbackRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 1500);
      },
    }
  );
  const tabLogic = useMemo(
    () =>
      makeActorLogic<
        TabAction,
        TabActionResults,
        string,
        chrome.runtime.MessageSender
      >(
        {
          [TabActionType.RunConfig]: () => evaluator.trigger(false),
        },
        noop,
        stringifyError
      ),
    [evaluator]
  );
  const tabActor = useMemo(
    () =>
      new ContextActor(nanoid(), tabLogic, {
        sendMessage(msg: unknown) {
          return chrome.runtime.sendMessage(prepareForSerialization(msg));
        },
      }),
    [tabLogic]
  );
  useEffect(() => {
    background.start();
    tabActor.start();
    return () => {
      tabActor.stop();
      background.stop();
    };
  }, [tabActor]);
  return (
    <Paper
      elevation={2}
      style={{
        position: "relative",
        visibility: isVisible ? "visible" : "hidden",
        padding: 16,
        paddingBottom: 0,
      }}
    >
      <IconButton
        color="error"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          visibility: evaluator.isMutating || !isVisible ? "hidden" : "visible",
          zIndex: 1,
        }}
        onClick={() => {
          evaluator.reset();
          setIsVisible(false);
        }}
      >
        <Close />
      </IconButton>
      <Box display={"flex"} flexDirection={"column"} gap={2} minWidth={400}>
        {evaluator.isMutating ? (
          <LinearProgress style={{ marginBottom: 16 }} />
        ) : evaluator.error ? (
          <>
            <ErrorAlert error={evaluator.error} />
            <Box display="flex" flexDirection="column" alignItems="center">
              <Button
                color="error"
                variant="contained"
                fullWidth
                onClick={() => evaluator.trigger(true)}
              >
                Retry with debug
              </Button>
              <Typography variant="caption" color="textSecondary">
                Logs will appear in DevTools console
              </Typography>
            </Box>
          </>
        ) : evaluator.data !== undefined ? (
          <Alert severity="success" style={{ marginBottom: 16 }}>
            <AlertTitle>Success</AlertTitle>
            <pre>
              <code>{stringify(evaluator.data)}</code>
            </pre>
          </Alert>
        ) : null}
      </Box>
      {children}
    </Paper>
  );
}

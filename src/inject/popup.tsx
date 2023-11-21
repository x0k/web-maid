import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { stringify } from "yaml";
import { nanoid } from "nanoid";
import { useMutation } from "@tanstack/react-query";

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
import { useOkShower } from "@/shared/react-ok-shower";

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

function stopPropagation(e: KeyboardEvent) {
  if (e.key !== "Escape") {
    e.stopPropagation();
  }
}

export function Popup({ sandbox }: PopupProps) {
  const [rootFactoryRef, children, clear] = useRootFactory();
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
          formShower,
          okShower,
          fetcher: new RemoteFetcher(BACKGROUND_ACTOR_ID, background),
          logger: console,
        })
      ),
    [sandbox, formShower, okShower]
  );
  const [isVisible, setIsVisible] = useState(false);
  const callbackRef = useRef<NodeJS.Timeout>();
  const evalMutation = useMutation({
    mutationFn: async (debug: boolean) => {
      clearTimeout(callbackRef.current);
      setIsVisible(true);
      const [local, sync] = await Promise.all([
        loadLocalSettings(),
        loadSyncSettings(),
      ] as const);
      const main = sync.configFiles.find((f) => f.id === "main");
      if (!main) {
        throw new Error("Main config not found");
      }
      return evalConfig(debug, main.content, local.secrets);
    },
    onSuccess() {
      callbackRef.current = setTimeout(() => {
        closePopup();
      }, 2000);
    },
  });
  const closePopup = useCallback(() => {
    setIsVisible(false);
    evalMutation.reset();
    clear();
  }, [evalMutation, clear]);
  const tabLogic = useMemo(
    () =>
      makeActorLogic<
        TabAction,
        TabActionResults,
        string,
        chrome.runtime.MessageSender
      >(
        {
          [TabActionType.RunConfig]: () => evalMutation.mutate(false),
        },
        noop,
        stringifyError
      ),
    [evalMutation]
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
  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePopup();
      }
    },
    [closePopup]
  );
  useEffect(() => {
    if (isVisible) {
      document.addEventListener("keydown", onEscape);
      document.addEventListener("keydown", stopPropagation, true);
    } else {
      document.removeEventListener("keydown", stopPropagation, true);
      document.removeEventListener("keydown", onEscape);
    }
    return () => {
      document.removeEventListener("keydown", stopPropagation, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isVisible, onEscape]);
  return (
    <Paper
      elevation={2}
      style={{
        position: "relative",
        padding: 16,
        display: isVisible ? "block" : "none",
      }}
    >
      <IconButton
        color="error"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1,
        }}
        onClick={closePopup}
      >
        <Close />
      </IconButton>
      <Box display={"flex"} flexDirection={"column"} gap={2} width={500}>
        {evalMutation.isPending ? (
          <Typography pb={2}>In progress...</Typography>
        ) : evalMutation.error ? (
          <>
            <ErrorAlert error={evalMutation.error} />
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              marginBottom="-10px"
            >
              <Button
                color="error"
                variant="contained"
                fullWidth
                onClick={() => evalMutation.mutate(true)}
              >
                Retry with debug
              </Button>
              <Typography variant="caption" color="textSecondary">
                Logs will appear in DevTools console
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="success">
            <AlertTitle>Success</AlertTitle>
            <pre>
              <code>{stringify(evalMutation.data)}</code>
            </pre>
          </Alert>
        )}
      </Box>
      {children}
    </Paper>
  );
}

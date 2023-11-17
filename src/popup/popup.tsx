import {
  Alert,
  AlertTitle,
  Box,
  Button,
  LinearProgress,
  Typography,
} from "@mui/material";
import { stringify } from "yaml";
import useSWRMutation from "swr/mutation";

import { ErrorAlert } from "@/components/error-alert";

import { InitData, makeConfigEval } from "./core";

export interface PopupProps {
  initPromise: Promise<InitData>;
}

export function Popup({ initPromise }: PopupProps) {
  const evaluator = useSWRMutation("eval", (_, { arg }: { arg: boolean }) =>
    initPromise.then(makeConfigEval(arg))
  );
  return (
    <Box display="flex" flexDirection="column" gap={2} p={2} width={400}>
      {evaluator.isMutating ? (
        <>
          <LinearProgress />
          <Typography>Loading...</Typography>
        </>
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
      ) : evaluator.data === undefined ? (
        <>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => evaluator.trigger(false)}
          >
            Run
          </Button>
        </>
      ) : (
        <Alert severity="success">
          <AlertTitle>Success</AlertTitle>
          <pre>
            <code>{stringify(evaluator.data)}</code>
          </pre>
        </Alert>
      )}
    </Box>
  );
}

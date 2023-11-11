import { Alert, AlertTitle } from "@mui/material";

import { stringifyError } from "@/lib/error";

export interface ErrorProps {
  title?: React.ReactNode
  error: unknown;
}

export function ErrorAlert({ error, title = "Error" }: ErrorProps) {
  return (
    <Alert severity="error">
      <AlertTitle>{title}</AlertTitle>
      {stringifyError(error)}
    </Alert>
  );
}

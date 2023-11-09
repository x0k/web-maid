import { Alert, AlertTitle } from "@mui/material";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export interface ErrorProps {
  title?: JSX.Element | string;
  error: unknown;
}

export function ErrorAlert({ error, title = "Error" }: ErrorProps) {
  return (
    <Alert severity="error">
      <AlertTitle>{title}</AlertTitle>
      {error instanceof ZodError
        ? fromZodError(error).message
        : error instanceof Error
        ? error.message
        : String(error)}
    </Alert>
  );
}

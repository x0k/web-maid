import { AlertCircle } from "lucide-react";

import { stringifyError } from "@/lib/error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface ErrorProps {
  title?: React.ReactNode;
  error: unknown;
}

export function ErrorAlert({ error, title = "Error" }: ErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{stringifyError(error)}</AlertDescription>
    </Alert>
  );
}

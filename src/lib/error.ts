import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export function stringifyError(error: unknown): string {
  return error instanceof ZodError
    ? fromZodError(error).message
    : error instanceof Error
    ? error.message
    : String(error);
}

import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export function stringifyError(error: unknown): string {
  if (error instanceof ZodError) {
    return fromZodError(error).message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return JSON.stringify(error);
}

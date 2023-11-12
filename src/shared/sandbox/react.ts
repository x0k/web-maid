import React, { useMemo } from "react";

import { IRemoteActor } from "@/lib/actor";

import type { SandboxAction, SandboxActionResults } from "./action";
import { FormDataValidator } from "./form-data-validator";

export const SandboxContext = React.createContext<IRemoteActor<
  SandboxAction,
  SandboxActionResults
> | null>(null);

export function useSandbox() {
  const sandbox = React.useContext(SandboxContext);
  if (sandbox === null) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }
  return sandbox;
}

export function useFormDataValidator(sandboxId: string) {
  const sandbox = useSandbox();
  return useMemo(
    () => new FormDataValidator(sandboxId, sandbox),
    [sandbox, sandboxId]
  );
}

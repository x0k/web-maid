import React, { useMemo } from "react";

import { IRemoteActor } from "@/lib/actor";

import type { SandboxAction, SandboxActionResults } from "./action";
import { RemoteFormDataValidator } from "./form-data-validator";

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

export function useFormDataValidator<T>(
  sandboxId: string,
  sandbox: IRemoteActor<SandboxAction<T>, SandboxActionResults<T>>
) {
  return useMemo(
    () => new RemoteFormDataValidator<T>(sandboxId, sandbox),
    [sandbox, sandboxId]
  );
}

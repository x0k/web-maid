import React from "react";

import { IRemoteActor } from "@/lib/actor";

import type { Action, ActionResults } from "@/shared/rpc";

export const SandboxContext = React.createContext<IRemoteActor<
  Action,
  ActionResults
> | null>(null);

export function useSandbox() {
  const sandbox = React.useContext(SandboxContext);
  if (sandbox === null) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }
  return sandbox;
}

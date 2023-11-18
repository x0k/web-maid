import { useMemo } from "react";
import { Root } from "react-dom/client";
import { Button } from "@mui/material";

import { AsyncFactory, Factory } from "@/lib/factory";

export class ReactOkShower implements AsyncFactory<string, void> {
  constructor(private readonly rootFactory: Factory<void, Root>) {}

  async Create(message: string): Promise<void> {
    const root = this.rootFactory.Create();
    return new Promise<void>((resolve) => {
      root.render(
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={() => resolve()}
        >
          {message}
        </Button>
      );
    }).finally(() => {
      root.unmount();
    });
  }
}

export function useOkShower(
  rootFactory: Factory<void, Root>
): AsyncFactory<string, void> {
  return useMemo(() => new ReactOkShower(rootFactory), [rootFactory]);
}

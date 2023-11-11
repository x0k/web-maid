import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

export abstract class BrowserFactory<
  Z extends z.ZodType,
  R
> extends TaskOpFactory<Z, R> {
  constructor(protected readonly window: Window) {
    super();
  }
}
